/**
 * @fileoverview Rule to prefer imports to AMD
 * @author Jamund Ferguson
 */

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            url: `${ruleDocsUrl}/no-amd.md`,
        },
    },

    create: function (context) {

        return {

            'CallExpression': function (node) {
          if (context.getScope().type !== 'module') return

          if (node.callee.type !== 'Identifier') return
          if (node.callee.name !== 'require' &&
              node.callee.name !== 'define') return

          // todo: capture define((require, module, exports) => {}) form?
          if (node.arguments.length !== 2) return

          const modules = node.arguments[0]
          if (modules.type !== 'ArrayExpression') return

          // todo: check second arg type? (identifier or callback)

                context.report(node, `Expected imports instead of AMD ${node.callee.name}().`)
            },
        }

    },
}
