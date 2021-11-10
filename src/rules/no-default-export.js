import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-default-export'),
    },
    schema: [],
  },

  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {};
    }

    const preferNamed = 'Prefer named exports.';
    const noAliasDefault = ({ local }) => `Do not alias \`${local.name}\` as \`default\`. Just export \`${local.name}\` itself instead.`;

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, message: preferNamed });
      },

      ExportNamedDeclaration(node) {
        node.specifiers.filter(specifier => specifier.exported.name === 'default').forEach(specifier => {
          if (specifier.type === 'ExportDefaultSpecifier') {
            context.report({ node, message: preferNamed });
          } else if (specifier.type === 'ExportSpecifier') {
            context.report({ node, message: noAliasDefault(specifier) });
          }
        });
      },
    };
  },
};
