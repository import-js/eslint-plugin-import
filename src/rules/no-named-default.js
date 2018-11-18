import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-named-default'),
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
