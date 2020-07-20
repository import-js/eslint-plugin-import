import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('match-default-export-name'),
    },
    fixable: 'code',
    schema: [],
  },

  create: function (context) {
    function checkDefault(nameKey, expected, defaultSpecifier) {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') return

      var declaration = importDeclaration(context)

      var imports = Exports.get(declaration.source.value, context)
      if (imports == null) return

      if (imports.errors.length) {
        imports.reportErrors(context, declaration)
        return
      }

      if (imports.has('default')) {
        var identifierName = imports.get('default').identifierName

        if (identifierName && identifierName !== defaultSpecifier[nameKey].name) {
          context.report({
            node: defaultSpecifier,
            message: 'Expected ' + expected + ' \'' + defaultSpecifier[nameKey].name +
            '\' to match the default export \'' + identifierName +
            '\'.',
            fix: fixer => fixer.replaceText(defaultSpecifier[nameKey], identifierName),
          })
        }
      }
    }
    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local', 'import'),
      'ExportDefaultSpecifier': checkDefault.bind(null, 'exported', 'export'),
    }
  },
}
