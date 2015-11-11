import Exports from '../core/getExports'

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
      context.report({
        node: node.source,
        message: `Parse errors in imported module ` +
                 `'${node.source.value}'.`,
      })
      return
    }

    var names = imports.named

    node.specifiers.forEach(function (im) {
      if (im.type !== type) return

      if (!names.has(im[key].name)) {
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
