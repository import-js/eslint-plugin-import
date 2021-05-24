'use strict'
exports.__esModule = true

const moduleRequire = require('./module-require').default
const extname = require('path').extname
const fs = require('fs')

const log = require('debug')('eslint-plugin-import:parse')

function getBabelVisitorKeys(parserPath) {
  const hypotheticalLocation = parserPath.replace('index.js', 'visitor-keys.js')
  if (fs.existsSync(hypotheticalLocation)) {
    const keys = moduleRequire(hypotheticalLocation)
    return keys.default || keys
  }
  return null
}

function keysFromParser(parserPath, parserInstance, parsedResult) {
  if (/.*espree.*/.test(parserPath)) {
    return parserInstance.VisitorKeys
  }
  if (/.*(babel-eslint|@babel\/eslint-parser).*/.test(parserPath)) {
    return getBabelVisitorKeys(parserPath)
  }
  if (/.*@typescript-eslint\/parser/.test(parserPath)) {
    if (parsedResult) {
      return parsedResult.visitorKeys
    }
  }
  return null
}

exports.default = function parse(path, content, context) {

  if (context == null) throw new Error('need context to parse properly')

  let parserOptions = context.parserOptions
  const parserPath = getParserPath(path, context)

  if (!parserPath) throw new Error('parserPath is required!')

  // hack: espree blows up with frozen options
  parserOptions = Object.assign({}, parserOptions)
  parserOptions.ecmaFeatures = Object.assign({}, parserOptions.ecmaFeatures)

  // always include comments and tokens (for doc parsing)
  parserOptions.comment = true
  parserOptions.attachComment = true  // keeping this for backward-compat with  older parsers
  parserOptions.tokens = true

  // attach node locations
  parserOptions.loc = true
  parserOptions.range = true

  // provide the `filePath` like eslint itself does, in `parserOptions`
  // https://github.com/eslint/eslint/blob/3ec436ee/lib/linter.js#L637
  parserOptions.filePath = path

  // @typescript-eslint/parser will parse the entire project with typechecking if you provide
  // "project" or "projects" in parserOptions. Removing these options means the parser will
  // only parse one file in isolate mode, which is much, much faster.
  // https://github.com/benmosher/eslint-plugin-import/issues/1408#issuecomment-509298962
  delete parserOptions.project
  delete parserOptions.projects

  // require the parser relative to the main module (i.e., ESLint)
  const parser = moduleRequire(parserPath)

  if (typeof parser.parseForESLint === 'function') {
    let ast
    try {
      const parserRaw = parser.parseForESLint(content, parserOptions)
      ast = parserRaw.ast
      return {
        ast,
        visitorKeys: keysFromParser(parserPath, parser, parserRaw),
      }
    } catch (e) {
      console.warn()
      console.warn('Error while parsing ' + parserOptions.filePath)
      console.warn('Line ' + e.lineNumber + ', column ' + e.column + ': ' + e.message)
    }
    if (!ast || typeof ast !== 'object') {
      console.warn(
        '`parseForESLint` from parser `' +
          parserPath +
          '` is invalid and will just be ignored'
      )
    } else {
      return {
        ast,
        visitorKeys: keysFromParser(parserPath, parser, undefined),
      }
    }
  }

  const keys = keysFromParser(parserPath, parser, undefined)
  return {
    ast: parser.parse(content, parserOptions),
    visitorKeys: keys,
  }
}


function getParserPath(path, context) {
  const parsers = context.settings['import/parsers']
  if (parsers != null) {
    const extension = extname(path)
    for (let parserPath in parsers) {
      if (parsers[parserPath].indexOf(extension) > -1) {
        // use this alternate parser
        log('using alt parser:', parserPath)
        return parserPath
      }
    }
  }
  // default to use ESLint parser
  return context.parserPath
}
