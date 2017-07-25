/**
 * @fileoverview Prevent CommonJS exports and import from being used in the same
 *   file.
 * @author Joe Lencioni
 */

const MESSAGE = 'Cannot use CommonJS exports in the same file as `import`'

module.exports = {
  meta: {
    docs: {},
  },

  create: function rule(context) {
    let usesImport = false
    let usesCommonJSExports = false

    function flagModuleExports(node) {
      usesCommonJSExports = true

      if (!usesImport) {
        return
      }

      context.report(node, MESSAGE)
    }

    return {
      ImportDeclaration(node) {
        usesImport = true

        if (usesCommonJSExports) {
          context.report(node, MESSAGE)
        }
      },

      AssignmentExpression(node) {
        if (node.left.type === 'MemberExpression') {
          // foo.bar = baz;
          const memberExpression = node.left
          if (memberExpression.object.name !== 'module') {
            return
          }
          if (memberExpression.property.name !== 'exports') {
            return
          }

          flagModuleExports(node)
        } else {
          // foo = bar;
          if (node.left.name !== 'exports') {
            return
          }

          flagModuleExports(node)
        }
      },

      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') {
          return
        }

        const memberExpression = node.callee
        if (memberExpression.object.name !== 'exports') {
          return
        }

        flagModuleExports(node)
      },
    }
  },
}
