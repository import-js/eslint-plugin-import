import * as path from 'path'
import Exports from '../ExportMap'

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {
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

        const deepLookup = imports.hasDeep(im[key].name)

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path
              .map(i => path.relative(path.dirname(context.getFilename()), i.path))
              .join(' -> ')

            context.report(im[key],
              `${im[key].name} not found via ${deepPath}`)
          } else {
            context.report(im[key],
              im[key].name + ' not found in \'' + node.source.value + '\'')
          }
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

  },
}
