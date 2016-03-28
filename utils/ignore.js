"use strict"
exports.__esModule = true

const extname = require('path').extname

// one-shot memoized
let cachedSet, lastSettings
function validExtensions(context) {
  if (cachedSet && context.settings === lastSettings) {
    return cachedSet
  }

  // todo: add 'mjs'?
  lastSettings = context.settings
  // breaking: default to '.js'
  // cachedSet = new Set(context.settings['import/extensions'] || [ '.js' ])
  cachedSet = 'import/extensions' in context.settings
    ? new Set(context.settings['import/extensions'])
    : { has: () => true } // the set of all elements

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
