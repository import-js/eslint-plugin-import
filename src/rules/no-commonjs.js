/**
 * @fileoverview Rule to prefer ES6 to CJS
 * @author Jamund Ferguson
 */

import docsUrl from '../docsUrl'

const EXPORT_MESSAGE = 'Expected "export" or "export default"'
    , IMPORT_MESSAGE = 'Expected "import" instead of "require()"'

function allowPrimitive(node, context) {
  if (context.options.indexOf('allow-primitive-modules') < 0) return false
  if (node.parent.type !== 'AssignmentExpression') return false
  return (node.parent.right.type !== 'ObjectExpression')
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-commonjs'),
    },
  },

  create: function (context) {

    return {

      'MemberExpression': function (node) {

        // module.exports
        if (node.object.name === 'module' && node.property.name === 'exports') {
          if (allowPrimitive(node, context)) return
          context.report({ node, message: EXPORT_MESSAGE })
        }

        // exports.
        if (node.object.name === 'exports') {
          const isInScope = context.getScope()
            .variables
            .some(variable => variable.name === 'exports')
          if (! isInScope) {
            context.report({ node, message: EXPORT_MESSAGE })
          }
        }

      },
      'CallExpression': function (call) {
        if (context.getScope().type !== 'module') return
        if (
          call.parent.type !== 'ExpressionStatement'
          && call.parent.type !== 'VariableDeclarator'
        ) return

        if (call.callee.type !== 'Identifier') return
        if (call.callee.name !== 'require') return

        if (call.arguments.length !== 1) return
        var module = call.arguments[0]

        if (module.type !== 'Literal') return
        if (typeof module.value !== 'string') return

        // keeping it simple: all 1-string-arg `require` calls are reported
        context.report({
          node: call.callee,
          message: IMPORT_MESSAGE,
        })
      },
    }

  },
}
