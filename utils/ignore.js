"use strict"
exports.__esModule = true

exports.default = function ignore(path, context) {
  // ignore node_modules by default
  const ignoreStrings = context.settings['import/ignore']
    ? [].concat(context.settings['import/ignore'])
    : ['node_modules']

  if (ignoreStrings.length === 0) return false

  for (let i = 0; i < ignoreStrings.length; i++) {
    const regex = new RegExp(ignoreStrings[i])
    if (regex.test(path)) return true
  }

  return false
}
