import { get as getExports } from '../core/getExports'
import importDeclaration from '../importDeclaration'

// not sure if this is needed with Babel
import 'array.prototype.find'

export default function (context) {
  function checkDefault(nameKey, defaultSpecifier) {
    var declaration = importDeclaration(context)

    var imports = getExports(declaration.source.value, context)
    if (imports == null) return

    if (imports.hasDefault &&
        imports.named.has(defaultSpecifier[nameKey].name)) {

      context.report(defaultSpecifier,
        'Using exported name \'' + defaultSpecifier[nameKey].name +
        '\' as identifier for default export.')

    }
  }
  return {
    'ImportDefaultSpecifier': checkDefault.bind(null, 'local'),
    'ExportDefaultSpecifier': checkDefault.bind(null, 'exported')
  }
}
