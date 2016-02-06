import fs from 'fs'

export default function (path, context) {

  if (context == null) throw new Error("need context to parse properly")

  const { parserOptions, parserPath } = context

  if (!parserPath) throw new Error("parserPath is required!")

  // require the parser relative to the main module (i.e., ESLint)
  const parser = require.main.require(parserPath)

  return parser.parse(
    fs.readFileSync(path, {encoding: 'utf8'}),
    parserOptions)
}
