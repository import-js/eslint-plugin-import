import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    docs: { url: docsUrl('no-named-export') },
  },

  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {}
    }

    const preferDefault = 'Prefer default export.'

    return {
      ExportAllDeclaration(node) {
        context.report({node, message: preferDefault})
      },

      ExportNamedDeclaration(node) {
        if (node.specifiers.length === 0) {
          return context.report({node, message: preferDefault})
        }

        const someNamed = node.specifiers.some(specifier => specifier.exported.name !== 'default')
        if (someNamed) {
          context.report({node, message: preferDefault})
        }
      },
    }
  },
}
