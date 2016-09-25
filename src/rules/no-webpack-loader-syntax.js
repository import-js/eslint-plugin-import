import isStaticRequire from '../core/staticRequire'

function reportIfNonStandard(context, node, name) {
  if (name.indexOf('!') !== -1) {
    context.report(node, `Unexpected '!' in '${name}'. ` +
      'Do not use import syntax to configure webpack loaders.'
    )
  }
}

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {
    return {
      ImportDeclaration: function handleImports(node) {
        reportIfNonStandard(context, node, node.source.value)
      },
      CallExpression: function handleRequires(node) {
        if (isStaticRequire(node)) {
          reportIfNonStandard(context, node, node.arguments[0].value)
        }
      },
    }
  },
}
