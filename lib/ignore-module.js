'use strict'

module.exports = function ignore(module, context) {
  var ignoreStrings = context.settings['import.ignore']
  if (ignoreStrings == null) return false

  for (var i = 0; i < ignoreStrings.length; i++) {
    var regex = new RegExp(ignoreStrings[i])
    if (regex.test(module)) return true
  }

  return false
}
