import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: docsUrl('no-named-export') },
  },

  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {}
    }

    const message = 'Named exports are not allowed.'

    return {
      ExportAllDeclaration(node) {
        context.report({node, message})
      },

      ExportNamedDeclaration(node) {
        if (node.specifiers.length === 0) {
          return context.report({node, message})
        }

        const someNamed = node.specifiers.some(specifier => specifier.exported.name !== 'default')
        if (someNamed) {
          context.report({node, message})
        }
      },
    }
  },
}
