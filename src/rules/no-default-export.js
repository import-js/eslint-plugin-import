import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid default exports.',
      url: docsUrl('no-default-export'),
    },
    schema: [],
  },

  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {}
    }

    const preferNamed = 'Prefer named exports.'
    const noAliasDefault = ({ local }) =>
      `Do not alias \`${local.name}\` as \`default\`. Just export \`${local.name}\` itself instead.`

    return {
      ExportDefaultDeclaration(node) {
        const { loc } = context.getSourceCode().getFirstTokens(node)[1] || {}
        context.report({ node, message: preferNamed, loc })
      },

      ExportNamedDeclaration(node) {
        node.specifiers
          .filter(
            specifier =>
              (specifier.exported.name || specifier.exported.value) ===
              'default',
          )
          .forEach(specifier => {
            const { loc } =
              context.getSourceCode().getFirstTokens(node)[1] || {}
            if (specifier.type === 'ExportDefaultSpecifier') {
              context.report({ node, message: preferNamed, loc })
            } else if (specifier.type === 'ExportSpecifier') {
              context.report({ node, message: noAliasDefault(specifier), loc })
            }
          })
      },
    }
  },
}
