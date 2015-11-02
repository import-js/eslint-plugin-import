import fs from 'fs'

const defaultParseOptions = { ecmaVersion: 6  // for espree, esprima. not needed
                                              // for babylon
                            , sourceType: "module"
                              // default plugins
                            , plugins: [ "decorators"
                                       , "jsx"
                                       , "classProperties"
                                       , "objectRestSpread"
                                       , "exportExtensions"
                                       , "exponentiationOperator"
                                       , "trailingFunctionCommas"
                                       ]
                            }

export default function parse(path, settings) {
  const parser = require(settings['import/parser'] || "babylon")
      , options = settings['import/parse-options'] || defaultParseOptions

  const ast = parser.parse( fs.readFileSync(path, {encoding: 'utf8'})
                          , options
                          )

  // bablyon returns top-level "File" node.
  return ast.type === 'File' ? ast.program : ast
}
