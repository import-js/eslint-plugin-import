/**
 * @fileoverview Rule to disallow mixed named and default ES6 exports.
 * @author Brian Donovan
 */

'use strict';

var NAMED_EXPORT_MESSAGE = 'Unexpected named export after default export';
var DEFAULT_EXPORT_MESSAGE = 'Unexpected default export after named export';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function(context) {
  var expectedModuleType = null;

  return {

    'ExportDefaultDeclaration': function(node) {
      if (!expectedModuleType) {
        expectedModuleType = 'default';
      }
      if (expectedModuleType !== 'default') {
        context.report(node, DEFAULT_EXPORT_MESSAGE);
      }
    },

    'ExportNamedDeclaration': function(node) {
      if (!expectedModuleType) {
        expectedModuleType = 'named';
      }
      if (expectedModuleType !== 'named') {
        context.report(node, NAMED_EXPORT_MESSAGE);
      }
    }

  };

};
