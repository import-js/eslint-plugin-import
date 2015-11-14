import fs from 'fs'

const defaultParseOptions = {
  ecmaVersion: 6,  // for espree, esprima. not needed for babylon
  sourceType: 'module',
}

export default function parse(path, { settings = {}, ecmaFeatures = {} } = {}) {
  const parser = settings['import/parser'] || 'babylon'

  const { parse } = require(parser)
      , options = Object.assign( {}
                               , defaultParseOptions
                               , settings['import/parse-options'])

  // detect and handle "jsx" ecmaFeature
  if (ecmaFeatures && parser === 'babylon') {
    const { jsx } = ecmaFeatures
    if (jsx && (!options.plugins || options.plugins.indexOf('jsx') < 0)) {
      if (!options.plugins) options.plugins = ['jsx']
      else options.plugins.push('jsx')
    }
  }

  const ast = parse( fs.readFileSync(path, {encoding: 'utf8'})
                   , options
                   )

  // bablyon returns top-level "File" node.
  return ast.type === 'File' ? ast.program : ast
}
