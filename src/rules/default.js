import { get as getExports } from '../core/getExports'

// not sure if this is needed with Babel?
import 'array.prototype.find'

export default function (context) {

  function checkDefault(specifierType, node) {
    var defaultSpecifier = node.specifiers
      .find(function (n) { return n.type === specifierType })

    if (!defaultSpecifier) return
    var imports = getExports(node.source.value, context)
    if (imports == null) return

    if (!imports.hasDefault) {
      context.report(defaultSpecifier, 'No default export found in module.')
    }
  }

  return {
    'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
    'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier')
  }
}
