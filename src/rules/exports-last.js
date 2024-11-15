import docsUrl from '../docsUrl';

function isNonExportStatement({ type }) {
  return type !== 'ExportDefaultDeclaration'
    && type !== 'ExportNamedDeclaration'
    && type !== 'ExportAllDeclaration';
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Ensure all exports appear after other statements.',
      url: docsUrl('exports-last'),
    },
    schema: [],
  },

  create(context) {
    return {
      Program({ body }) {
        const lastNonExportStatementIndex = body.findLastIndex(isNonExportStatement);

        if (lastNonExportStatementIndex !== -1) {
          body.slice(0, lastNonExportStatementIndex).forEach((node) => {
            if (!isNonExportStatement(node)) {
              context.report({
                node,
                message: 'Export statements should appear at the end of the file',
              });
            }
          });
        }
      },
    };
  },
};
