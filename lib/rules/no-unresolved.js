/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

'use strict'

var resolve = require('../core/resolve')

module.exports = function (context) {
  return {
    'ImportDeclaration': function (node) {
      if (resolve(node.source.value, context) == null) {
        context.report(node.source,
          'Unable to resolve path to module \'' + node.source.value + '\'.')
      }
    }
  }
}
