import Exports from '../ExportMap'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/default.md`,
    },
  },

  create: function (context) {

    function checkDefault(specifierType, node) {

      // poor man's Array.find
      let defaultSpecifier
      node.specifiers.some((n) => {
        if (n.type === specifierType) {
          defaultSpecifier = n
          return true
        }
      })

      if (!defaultSpecifier) return
      var imports = Exports.get(node.source.value, context)
      if (imports == null) return

      if (imports.errors.length) {
        imports.reportErrors(context, node)
      } else if (imports.get('default') === undefined) {
        context.report(defaultSpecifier, 'No default export found in module.')
      }
    }

    return {
      'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
      'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier'),
    }
  },
}
