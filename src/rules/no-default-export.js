const schema = {
  'type': 'object',
  'properties': {
    'allowAliasing': { 'type': 'boolean' },
  },
  'additionalProperties': false,
}
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {},
    schema: [schema],
  },

  create(context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {}
    }

    const preferNamed = 'Prefer named exports.'
    const noAliasDefault = ({local}) =>
      `Do not alias \`${local.name}\` as \`default\`. Just export ` +
      `\`${local.name}\` itself instead.`

    const { allowAliasing } = context.options[0] || {};

    return {
      ExportDefaultDeclaration(node) {
        context.report({node, message: preferNamed})
      },

      ExportNamedDeclaration(node) {
        node.specifiers.forEach(specifier => {
          if (specifier.type === 'ExportDefaultSpecifier' &&
              specifier.exported.name === 'default') {
            context.report({node, message: preferNamed})
          } else if (specifier.type === 'ExportSpecifier' &&
              specifier.exported.name === 'default' && 
              !allowAliasing) {
            context.report({node, message: noAliasDefault(specifier)})
          }
        })
      },
    }
  },
}
