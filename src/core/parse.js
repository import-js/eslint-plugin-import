import moduleRequire from './module-require'
import assign from 'object-assign'

export default function (content, context) {

  if (context == null) throw new Error('need context to parse properly')

  let { parserOptions, parserPath } = context

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
