/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

'use strict'

var resolve = require('../core/resolve')
  , ignore = require('../ignore-module')

module.exports = function (context) {
  return {
    'ImportDeclaration': function (node) {
      if (ignore(node.source.value, context)) return

      if (resolve(node.source.value, context) == null) {
        context.report(node.source,
          'Unable to resolve path to module \'' + node.source.value + '\'.')
      }
    }
  }
}
