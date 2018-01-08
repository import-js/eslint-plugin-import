/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/no-namespace.md`,
    },
  },

  create: function (context) {
    return {
      'ImportNamespaceSpecifier': function (node) {
        context.report(node, `Unexpected namespace import.`)
      },
    }
  },
}
