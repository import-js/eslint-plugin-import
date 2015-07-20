'use strict'

var getExports = require('../core/getExports').get

require('array.prototype.find')

module.exports = function (context) {
  return {
    'ImportDeclaration': function (node) {
      var defaultSpecifier = node.specifiers
        .find(function (n) { return n.type === 'ImportDefaultSpecifier' })

      if (!defaultSpecifier) return

      var imports = getExports(node.source.value, context)
      if (imports == null) return

      if (!imports.hasDefault) {
        context.report(defaultSpecifier, 'No default export found in module.')
      }
    }
  }
}
