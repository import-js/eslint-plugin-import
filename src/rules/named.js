'use strict'

var getExports = require('../core/getExports').get

module.exports = function (context) {
  function checkSpecifiers(key, type) { return function (node) {
    if (!node.specifiers
          .some(function (im) { return im.type === type })) {
      return // no named imports
    }

    var imports = getExports(node.source.value, context)
    if (imports == null) return

    var names = imports.named

    node.specifiers.forEach(function (im) {
      if (im.type !== type) return

      if (!names.has(im[key].name)) {
        context.report(im[key],
          im[key].name + ' not found in \'' + node.source.value + '\'')
      }
    })
  }}

  return {
    'ImportDeclaration': checkSpecifiers('imported', 'ImportSpecifier'),
    'ExportNamedDeclaration': checkSpecifiers('local', 'ExportSpecifier')
  }
}
