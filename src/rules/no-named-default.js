const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/no-named-default.md`,
    },
  },

  create: function (context) {
    return {
      'ImportDeclaration': function (node) {
        node.specifiers.forEach(function (im) {
          if (im.type === 'ImportSpecifier' && im.imported.name === 'default') {
            context.report({
              node: im.local,
              message: `Use default import syntax to import '${im.local.name}'.` })
          }
        })
      },
    }
  },
}
