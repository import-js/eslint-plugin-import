import fs from 'fs'

export default function parse(path, settings) {
  var parser = require(settings['import/parser'] || "babel-core")

  return parser.parse( fs.readFileSync(path, {encoding: 'utf8'})
                     , { ecmaVersion: 6
                       , sourceType: "module"
                       }
                     )
}
