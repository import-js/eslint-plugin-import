import Exports from 'eslint-module-utils/ExportMap'

module.exports = function (context) {
  function checkSpecifiers(key, type, node) {
    if (node.source == null) return // local export, ignore

    if (!node.specifiers
          .some(function (im) { return im.type === type })) {
      return // no named imports/exports
    }

    const imports = Exports.get(node.source.value, context)
    if (imports == null) return

    if (imports.errors.length) {
      imports.reportErrors(context, node)
      return
    }

    node.specifiers.forEach(function (im) {
      if (im.type !== type) return

      if (!imports.get(im[key].name)) {
        context.report(im[key],
          im[key].name + ' not found in \'' + node.source.value + '\'')
      }
    })
  }

  return {
    'ImportDeclaration': checkSpecifiers.bind( null
                                             , 'imported'
                                             , 'ImportSpecifier'
                                             ),

    'ExportNamedDeclaration': checkSpecifiers.bind( null
                                                  , 'local'
                                                  , 'ExportSpecifier'
                                                  ),
  }

}
