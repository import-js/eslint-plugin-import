function isExportStatement({ type }) {
  // ES Module export statements
  if (type === 'ExportDefaultDeclaration' || type === 'ExportNamedDeclaration') {
    return true
  }

  return false
}

const rule = {
  create(context) {
    return {
      Program({ body }) {
        const lastNonExportStatement = body.reduce((acc, node, index) => {
          if (isExportStatement(node)) {
            return acc
          }
          return index
        }, 0)

        body.forEach((node, index) => {
          if (isExportStatement(node) && index < lastNonExportStatement) {

            context.report({
              node,
              message: 'Export statements should appear at the end of the file',
            })
          }
        })
      },
    }
  },
}

export default rule
