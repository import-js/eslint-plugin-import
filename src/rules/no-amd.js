/**
 * @fileoverview Rule to prefer imports to AMD
 * @author Jamund Ferguson
 */

import docsUrl from '../docsUrl'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Module systems',
      description: 'Forbid AMD `require` and `define` calls.',
      url: docsUrl('no-amd'),
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (context.getScope().type !== 'module') {
          return
        }

        if (node.callee.type !== 'Identifier') {
          return
        }
        if (node.callee.name !== 'require' && node.callee.name !== 'define') {
          return
        }

        // todo: capture define((require, module, exports) => {}) form?
        if (node.arguments.length !== 2) {
          return
        }

        const modules = node.arguments[0]
        if (modules.type !== 'ArrayExpression') {
          return
        }

        // todo: check second arg type? (identifier or callback)

        context.report(
          node,
          `Expected imports instead of AMD ${node.callee.name}().`,
        )
      },
    }
  },
}
