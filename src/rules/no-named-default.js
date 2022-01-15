import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-named-default'),
    },
    schema: [],
  },

  create(context) {
    return {
      'ImportDeclaration': function (node) {
        node.specifiers.forEach(function (im) {
          if (im.importKind === 'type' || im.importKind === 'typeof') {
            return;
          }

          if (im.type === 'ImportSpecifier' && (im.imported.name || im.imported.value) === 'default') {
            context.report({
              node: im.local,
              message: `Use default import syntax to import '${im.local.name}'.` });
          }
        });
      },
    };
  },
};
