'use strict'

var getExports = require('eslint-import-core/getExports')
  , importDeclaration = require('../importDeclaration')

require('array.prototype.find')

module.exports = function (context) {
  return {
    'ImportDefaultSpecifier': function (defaultSpecifier) {

      var declaration = importDeclaration(context)

      var imports = getExports(declaration.source.value, context)
      if (imports == null) return

      if (imports.hasDefault &&
          imports.named.has(defaultSpecifier.local.name)) {

        context.report(defaultSpecifier,
          'Using exported name \'' + defaultSpecifier.local.name +
          '\' as identifier for default export.')

      }
    }
  }
}
