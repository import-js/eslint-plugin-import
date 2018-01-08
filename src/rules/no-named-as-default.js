import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/no-named-as-default.md`,
    },
  },

  create: function (context) {
    function checkDefault(nameKey, defaultSpecifier) {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') return

      var declaration = importDeclaration(context)

      var imports = Exports.get(declaration.source.value, context)
      if (imports == null) return

      if (imports.errors.length) {
        imports.reportErrors(context, declaration)
        return
      }

      if (imports.has('default') &&
          imports.has(defaultSpecifier[nameKey].name)) {

        context.report(defaultSpecifier,
          'Using exported name \'' + defaultSpecifier[nameKey].name +
          '\' as identifier for default export.')

      }
    }
    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local'),
      'ExportDefaultSpecifier': checkDefault.bind(null, 'exported'),
    }
  },
}
