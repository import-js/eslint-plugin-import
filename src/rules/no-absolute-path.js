import isStaticRequire from '../core/staticRequire'

function reportIfAbsolute(context, node, name) {
  if (isAbsolute(name)) {
    context.report(node, 'Do not import modules using an absolute path')
  }
}

function isAbsolute(name) {
  return name.indexOf('/') === 0
}

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {
    return {
      ImportDeclaration: function handleImports(node) {
        reportIfAbsolute(context, node, node.source.value)
      },
      CallExpression: function handleRequires(node) {
        if (isStaticRequire(node)) {
          reportIfAbsolute(context, node, node.arguments[0].value)
        }
      },
    }
  },
}
