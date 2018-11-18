import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('no-named-as-default'),
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
