/**
 * @fileoverview Rule to prefer ES6 to CJS
 * @author Jamund Ferguson
 */

import docsUrl from '../docsUrl'

const EXPORT_MESSAGE = 'Expected "export" or "export default"'
const IMPORT_MESSAGE = 'Expected "import" instead of "require()"'

function normalizeLegacyOptions(options) {
  if (options.indexOf('allow-primitive-modules') >= 0) {
    return { allowPrimitiveModules: true }
  }
  return options[0] || {}
}

function allowPrimitive(node, options) {
  if (!options.allowPrimitiveModules) {
    return false
  }
  if (node.parent.type !== 'AssignmentExpression') {
    return false
  }
  return node.parent.right.type !== 'ObjectExpression'
}

function allowRequire(node, options) {
  return options.allowRequire
}

function allowConditionalRequire(node, options) {
  return options.allowConditionalRequire !== false
}

function validateScope(scope) {
  return scope.variableScope.type === 'module'
}

// https://github.com/estree/estree/blob/HEAD/es5.md
function isConditional(node) {
  if (
    node.type === 'IfStatement' ||
    node.type === 'TryStatement' ||
    node.type === 'LogicalExpression' ||
    node.type === 'ConditionalExpression'
  ) {
    return true
  }
  if (node.parent) {
    return isConditional(node.parent)
  }
  return false
}

function isLiteralString(node) {
  return (
    (node.type === 'Literal' && typeof node.value === 'string') ||
    (node.type === 'TemplateLiteral' && node.expressions.length === 0)
  )
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const schemaString = { enum: ['allow-primitive-modules'] }
const schemaObject = {
  type: 'object',
  properties: {
    allowPrimitiveModules: { type: 'boolean' },
    allowRequire: { type: 'boolean' },
    allowConditionalRequire: { type: 'boolean' },
  },
  additionalProperties: false,
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Module systems',
      description:
        'Forbid CommonJS `require` calls and `module.exports` or `exports.*`.',
      url: docsUrl('no-commonjs'),
    },

    schema: {
      anyOf: [
        {
          type: 'array',
          items: [schemaString],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [schemaObject],
          additionalItems: false,
        },
      ],
    },
  },

  create(context) {
    const options = normalizeLegacyOptions(context.options)

    return {
      MemberExpression(node) {
        // module.exports
        if (node.object.name === 'module' && node.property.name === 'exports') {
          if (allowPrimitive(node, options)) {
            return
          }
          context.report({ node, message: EXPORT_MESSAGE })
        }

        // exports.
        if (node.object.name === 'exports') {
          const isInScope = context
            .getScope()
            .variables.some(variable => variable.name === 'exports')
          if (!isInScope) {
            context.report({ node, message: EXPORT_MESSAGE })
          }
        }
      },
      CallExpression(call) {
        if (!validateScope(context.getScope())) {
          return
        }

        if (call.callee.type !== 'Identifier') {
          return
        }
        if (call.callee.name !== 'require') {
          return
        }

        if (call.arguments.length !== 1) {
          return
        }
        if (!isLiteralString(call.arguments[0])) {
          return
        }

        if (allowRequire(call, options)) {
          return
        }

        if (
          allowConditionalRequire(call, options) &&
          isConditional(call.parent)
        ) {
          return
        }

        // keeping it simple: all 1-string-arg `require` calls are reported
        context.report({
          node: call.callee,
          message: IMPORT_MESSAGE,
        })
      },
    }
  },
}
