import isStaticRequire from '../core/staticRequire'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

function reportIfNonStandard(context, node, name) {
  if (name.indexOf('!') !== -1) {
    context.report(node, `Unexpected '!' in '${name}'. ` +
      'Do not use import syntax to configure webpack loaders.'
    )
  }
}

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/no-webpack-loader-syntax.md`,
    },
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
