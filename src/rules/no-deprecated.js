import Exports from '../core/getExports'

module.exports = function (context) {
  function checkSpecifiers(node) {
    if (node.source == null) return // local export, ignore

    const imports = Exports.get(node.source.value, context)
    if (imports == null) return

    if (imports.errors.length) {
      imports.reportErrors(context, node)
      return
    }

    node.specifiers.forEach(function (im) {
      let imported
      switch (im.type) {
        case 'ImportDefaultSpecifier': imported = 'default'; break
        case 'ImportSpecifier': imported = im.imported.name; break
        default: return // can't handle this one
      }

      // unknown thing can't be deprecated
      if (!imports.named.has(imported)) return

      const metadata = imports.named.get(imported)
      if (!metadata || !metadata.doc) return

      let deprecation
      if (metadata.doc.tags.some(t => t.title === 'deprecated' && (deprecation = t))) {
        context.report(im,
          'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.'))
      }
    })
  }

  return {
    'ImportDeclaration': checkSpecifiers,
  }
}
