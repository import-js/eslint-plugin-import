import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid named default exports.',
      url: docsUrl('no-named-default'),
    },
    schema: [],
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        node.specifiers.forEach(function (im) {
          if (im.importKind === 'type' || im.importKind === 'typeof') {
            return
          }

          if (
            im.type === 'ImportSpecifier' &&
            (im.imported.name || im.imported.value) === 'default'
          ) {
            context.report({
              node: im.local,
              message: `Use default import syntax to import '${im.local.name}'.`,
            })
          }
        })
      },
    }
  },
}
