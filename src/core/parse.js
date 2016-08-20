import moduleRequire from './module-require'
import assign from 'object-assign'
import { extname } from 'path'
import debug from 'debug'

const log = debug('eslint-plugin-import:parse')

export default function (path, content, context) {

  if (context == null) throw new Error('need context to parse properly')

  let { parserOptions } = context
  const parserPath = getParserPath(path, context)

  if (!parserPath) throw new Error('parserPath is required!')

  // hack: espree blows up with frozen options
  parserOptions = assign({}, parserOptions)
  parserOptions.ecmaFeatures = assign({}, parserOptions.ecmaFeatures)

  // always attach comments
  parserOptions.attachComment = true

  // require the parser relative to the main module (i.e., ESLint)
  const parser = moduleRequire(parserPath)

  return parser.parse(content, parserOptions)
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
