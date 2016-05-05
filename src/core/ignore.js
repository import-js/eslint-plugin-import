import { extname } from 'path'
import Set from 'es6-set'

// one-shot memoized
let cachedSet, lastSettings
function validExtensions({ settings }) {
  if (cachedSet && settings === lastSettings) {
    return cachedSet
  }

  // todo: add 'mjs'?
  lastSettings = settings
  // breaking: default to '.js'
  // cachedSet = new Set(settings['import/extensions'] || [ '.js' ])
  cachedSet = 'import/extensions' in settings
    ? new Set(settings['import/extensions'])
    : { has: () => true } // the set of all elements

  return cachedSet
}

export default function ignore(path, context) {
  // ignore node_modules by default
  const ignoreStrings = context.settings['import/ignore']
    ? [].concat(context.settings['import/ignore'])
    : ['node_modules']

  // check extension whitelist first (cheap)
  if (!validExtensions(context).has(extname(path))) return true

  if (ignoreStrings.length === 0) return false

  for (var i = 0; i < ignoreStrings.length; i++) {
    var regex = new RegExp(ignoreStrings[i])
    if (regex.test(path)) return true
  }

  return false
}
