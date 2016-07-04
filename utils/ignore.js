"use strict"
exports.__esModule = true

const extname = require('path').extname

const log = require('debug')('eslint-plugin-import:utils:ignore')

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
  // check extension whitelist first (cheap)
  if (!validExtensions(context).has(extname(path))) return true

  if (!('import/ignore' in context.settings)) return false
  const ignoreStrings = context.settings['import/ignore']

  for (let i = 0; i < ignoreStrings.length; i++) {
    const regex = new RegExp(ignoreStrings[i])
    if (regex.test(path)) {
      log(`ignoring ${path}, matched pattern /${ignoreStrings[i]}/`)
      return true
    }
  }

  return false
}
