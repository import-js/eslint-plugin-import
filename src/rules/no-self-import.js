/**
 * @fileOverview Forbids a module from importing itself
 * @author Gio d'Amelio
 */

import resolve from 'eslint-module-utils/resolve'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'

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
    type: 'problem',
    docs: {
      description: 'Forbid a module from importing itself',
      recommended: true,
      url: docsUrl('no-self-import'),
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
