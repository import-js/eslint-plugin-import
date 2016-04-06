/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function (context) {
  return {
    'ImportNamespaceSpecifier': function (node) {
      context.report(node, `Unexpected namespace import.`)
    },
  }
}
