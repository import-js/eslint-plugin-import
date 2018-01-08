/**
 * @fileOverview Forbids a module from importing itself
 * @author Gio d'Amelio
 */

import resolve from 'eslint-module-utils/resolve'
import isStaticRequire from '../core/staticRequire'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

function isImportingSelf(context, node, requireName) {
  const filePath = context.getFilename()

  // If the input is from stdin, this test can't fail
  if (filePath !== '<text>' && filePath === resolve(requireName, context)) {
    context.report({
        node,
        message: 'Module imports itself.',
    })
  }
}

module.exports = {
  meta: {
    docs: {
      description: 'Forbid a module from importing itself',
      recommended: true,
      url: `${ruleDocsUrl}/no-self-import.md`,
    },

    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        isImportingSelf(context, node, node.source.value)
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
          isImportingSelf(context, node, node.arguments[0].value)
        }
      },
    }
  },
}
