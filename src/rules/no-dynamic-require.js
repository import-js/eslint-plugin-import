import docsUrl from '../docsUrl'

function isRequire(node) {
  return (
    node &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length >= 1
  )
}

function isDynamicImport(node) {
  return node && node.callee && node.callee.type === 'Import'
}

function isStaticValue(arg) {
  return (
    arg.type === 'Literal' ||
    (arg.type === 'TemplateLiteral' && arg.expressions.length === 0)
  )
}

const dynamicImportErrorMessage = 'Calls to import() should use string literals'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Static analysis',
      description: 'Forbid `require()` calls with expressions.',
      url: docsUrl('no-dynamic-require'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          esmodule: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}

    return {
      CallExpression(node) {
        if (!node.arguments[0] || isStaticValue(node.arguments[0])) {
          return
        }
        if (isRequire(node)) {
          return context.report({
            node,
            message: 'Calls to require() should use string literals',
          })
        }
        if (options.esmodule && isDynamicImport(node)) {
          return context.report({
            node,
            message: dynamicImportErrorMessage,
          })
        }
      },
      ImportExpression(node) {
        if (!options.esmodule || isStaticValue(node.source)) {
          return
        }
        return context.report({
          node,
          message: dynamicImportErrorMessage,
        })
      },
    }
  },
}
