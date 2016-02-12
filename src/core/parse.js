import fs from 'fs'

export default function (p, context) {

  if (context == null) throw new Error("need context to parse properly")

  let { parserOptions, parserPath } = context

  if (!parserPath) throw new Error("parserPath is required!")

  // hack: espree blows up with frozen options
  parserOptions = Object.assign({}, parserOptions)
  parserOptions.ecmaFeatures = Object.assign({}, parserOptions.ecmaFeatures)

  // require the parser relative to the main module (i.e., ESLint)
  const parser = requireParser(parserPath)

  return parser.parse(
    fs.readFileSync(p, {encoding: 'utf8'}),
    parserOptions)
}

import Module from 'module'
import * as path from 'path'

// borrowed from babel-eslint
function createModule(filename) {
  var mod = new Module(filename)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  return mod
}

function requireParser(p) {
  try {
    // attempt to get espree relative to eslint
    const eslintPath = require.resolve('eslint')
    const eslintModule = createModule(eslintPath)
    return require(Module._resolveFilename('espree', eslintModule))
  } catch(err) { /* ignore */ }

  try {
    // try relative to entry point
    return require.main.require(p)
  } catch(err) { /* ignore */ }

  // finally, try from here
  return require(p)
}
