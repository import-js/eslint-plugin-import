import Exports from 'eslint-module-utils/ExportMap'
import importDeclaration from '../importDeclaration'

module.exports = function (context) {
  function checkDefault(nameKey, defaultSpecifier) {
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
}
