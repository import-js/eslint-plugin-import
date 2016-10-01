import has from 'has'

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {
    function checkSpecifiers(type, node) {
      if (node.source == null) return

      const hasImportSpecifier = node.specifiers.some(function (im) {
        return im.type === type
      })

      if (!hasImportSpecifier) {
        return
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== type) return

        const isDefault = im.imported.name === 'default'
        const isNamed = has(im.local, 'name')

        if (isDefault && isNamed) {
          context.report(im.local,
            'Using name \'' + im.local.name +
            '\' as identifier for default export.')
        }
      })
    }
    return {
      'ImportDeclaration': checkSpecifiers.bind(null, 'ImportSpecifier'),
    }
  },
}
