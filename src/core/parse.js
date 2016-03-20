import fs from 'fs'
import moduleRequire from './module-require'

export default function (p, context) {

  if (context == null) throw new Error("need context to parse properly")

  let { parserOptions, parserPath } = context

  if (!parserPath) throw new Error("parserPath is required!")

  // hack: espree blows up with frozen options
  parserOptions = Object.assign({}, parserOptions)
  parserOptions.ecmaFeatures = Object.assign({}, parserOptions.ecmaFeatures)

  // always attach comments
  parserOptions.attachComment = true

  // require the parser relative to the main module (i.e., ESLint)
  const parser = moduleRequire(parserPath)

  return parser.parse(
    fs.readFileSync(p, {encoding: 'utf8'}),
    parserOptions)
}
