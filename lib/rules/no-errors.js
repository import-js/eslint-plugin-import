'use strict'

var getExports = require('eslint-import-core/getExports')

module.exports = function (context) {
  function message(node, errors) {
    var m =
      'Errors encountered while analysing imported module \'' +
        node.source.value + '\'.'

    if (context.options[0] === 'include-messages') {
      m += '\n' + errors.join('\n')
    }

    return m
  }

  return {
    'ImportDeclaration': function (node) {
      var imports = getExports(node.source.value, context)
      if (imports == null) return

      if (imports.errors.length > 0) {
        context.report(node.source, message(node, imports.errors))
      }
    }
  }
}
