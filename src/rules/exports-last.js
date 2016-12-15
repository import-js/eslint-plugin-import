const isExportStatement = ({ type }) =>
  type === 'ExportDefaultDeclaration'
  || type === 'ExportNamedDeclaration'
  || type === 'ExportAllDeclaration'

const rule = {
  create(context) {
    return {
      Program({ body }) {
        const firstExportStatementIndex = body.findIndex(isExportStatement)

        if (firstExportStatementIndex !== -1) {
          body.slice(firstExportStatementIndex).forEach((node) => {
            if (!isExportStatement(node)) {
              context.report({
                node,
                message: 'Export statements should appear at the end of the file',
              })
            }
          })
        }
      },
    }
  },
}

export default rule
