import docsUrl from '../docsUrl';

const findLastIndex = (array, predicate) => {
  let i = array.length - 1;
  while (i >= 0) {
    if (predicate(array[i])) {
      return i;
    }
    i--;
  }
  return -1;
};

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
        const lastNonExportStatementIndex = findLastIndex(body, isNonExportStatement);

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
