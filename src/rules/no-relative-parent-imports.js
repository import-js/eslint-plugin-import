import docsUrl from '../docsUrl'

import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-relative-parent-imports'),
    },
  },

  create: function noRelativePackages(context) {

    function checkImportForRelativeParentPath(importPath, node) {
      if (importType(importPath, context) === 'parent') {
        context.report({
          node,
          message: 'Relative imports from parent directories are not allowed. ',
        })
      }
    }

    return {
      ImportDeclaration(node) {
        checkImportForRelativeParentPath(node.source.value, node.source)
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
          const [ firstArgument ] = node.arguments
          checkImportForRelativeParentPath(firstArgument.value, firstArgument)
        }
      },
    }
  },
}
