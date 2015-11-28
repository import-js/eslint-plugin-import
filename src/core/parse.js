import fs from 'fs'

const defaultParseOptions = {
  ecmaVersion: 6,  // for espree, esprima. not needed for babylon
  sourceType: 'module',
}

export default function (path, { settings, ecmaFeatures } = {}) {
  const parser = (settings && settings['import/parser']) || 'babylon'

  const { parse } = require(parser)
      , options = getOptions(parser, settings, ecmaFeatures)

  const ast = parse( fs.readFileSync(path, {encoding: 'utf8'})
                   , options
                   )

  // bablyon returns top-level "File" node.
  return ast.type === 'File' ? ast.program : ast
}


function getOptions(parser, settings, ecmaFeatures) {

  let options = Object.assign( {}
                             , defaultParseOptions
                             , settings && settings['import/parse-options'])

  function inferFeature(feat) {
    if (ecmaFeatures[feat] && (options.plugins.indexOf(feat) < 0)) {
      options.plugins.push(feat)
    }
  }

  // detect and handle "jsx" ecmaFeature
  if (parser === 'babylon') {
    if (ecmaFeatures) {
      options.plugins = options.plugins ? options.plugins.slice() : []
      inferFeature('jsx')
      inferFeature('flow')
    }
  }

  return options
}
