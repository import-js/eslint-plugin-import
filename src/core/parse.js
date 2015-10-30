import fs from 'fs'

export default function parse(path, settings) {
  var parser = require(settings['import/parser'] || "babylon")

  // todo: parser option setting
  const ast = parser.parse( fs.readFileSync(path, {encoding: 'utf8'})
                          , { ecmaVersion: 6
                            , sourceType: "module"
                            , plugins: [ "decorators"
                                       , "jsx"
                                       , "classProperties"
                                       , "objectRestSpread"
                                       , "exportExtensions"
                                       , "exponentiationOperator"
                                       , "trailingFunctionCommas"
                                       ]
                            }
                          )

  // bablyon returns top-level "File" node.
  return ast.type === 'File' ? ast.program : ast
}
