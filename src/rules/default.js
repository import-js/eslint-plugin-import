import Exports from '../core/getExports'

module.exports = function (context) {

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

    if (!imports.hasDefault) {
      context.report(defaultSpecifier, 'No default export found in module.')
    }
  }

  return {
    'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
    'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier')
  }
}
