import Exports from '../core/getExports'
import importDeclaration from '../importDeclaration'

module.exports = function (context) {
  function checkDefault(nameKey, defaultSpecifier) {
    var declaration = importDeclaration(context)

    var imports = Exports.get(declaration.source.value, context)
    if (imports == null) return

    if (imports.errors.length) {
      context.report({
        node: declaration.source,
        message: `Parse errors in imported module ` +
                 `'${declaration.source.value}'.`,
      })
      return
    }

    if (imports.hasDefault &&
        imports.named.has(defaultSpecifier[nameKey].name)) {

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
