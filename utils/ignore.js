"use strict"
exports.__esModule = true

const extname = require('path').extname

// one-shot memoized
let cachedSet, lastSettings
function validExtensions(context) {
  if (cachedSet && context.settings === lastSettings) {
    return cachedSet
  }

  lastSettings = context.settings
  cachedSet = new Set(context.settings['import/extensions'] || [ '.js' ])
  return cachedSet
}

exports.default = function ignore(path, context) {
  // ignore node_modules by default
  const ignoreStrings = context.settings['import/ignore']
    ? [].concat(context.settings['import/ignore'])
    : ['node_modules']

  // check extension whitelist first (cheap)
  if (!validExtensions(context).has(extname(path))) return true

  if (ignoreStrings.length === 0) return false

  for (let i = 0; i < ignoreStrings.length; i++) {
    const regex = new RegExp(ignoreStrings[i])
    if (regex.test(path)) return true
  }

  return false
}
