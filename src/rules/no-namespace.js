/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

import docsUrl from '../docsUrl'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-namespace'),
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
