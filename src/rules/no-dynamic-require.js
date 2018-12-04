import docsUrl from '../docsUrl'

function isRequire(node) {
  return node &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length >= 1
}

function isStaticValue(arg) {
  return arg.type === 'Literal' ||
    (arg.type === 'TemplateLiteral' && arg.expressions.length === 0)
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-dynamic-require'),
    },
  },

  create: function (context) {
    return {
      CallExpression(node) {
        if (isRequire(node) && !isStaticValue(node.arguments[0])) {
          context.report({
            node,
            message: 'Calls to require() should use string literals',
          })
        }
      },
    }
  },
}
