import fs from 'fs'

export default function (path, { parserOptions, parserName } = {}) {

  const parser = require(parserName)

  return parser.parse(
    fs.readFileSync(path, {encoding: 'utf8'}),
    parserOptions)
}
