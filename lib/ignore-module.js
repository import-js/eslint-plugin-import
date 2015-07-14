'use strict'

function ignoreMatch(module, context) {
  var ignoreStrings = context.settings['import.ignore']
  if (ignoreStrings == null) return false

  for (var i = 0; i < ignoreStrings.length; i++) {
    var regex = new RegExp(ignoreStrings[i])
    if (regex.test(module)) return true
  }

  return false
}

function optionMatch(module, context) {
  switch (context.options[0]) {

    case 'all':
      return false

    case 'relative-only':
    default:
      return module[0] !== '.'
  }
}

module.exports = function ignore(module, context) {
  return optionMatch(module, context) ||
         ignoreMatch(module, context)
}
