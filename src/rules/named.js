import * as path from 'path'
import Exports from '../ExportMap'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('named'),
    },
  },

  create: function (context) {
    function checkSpecifiers(key, type, node) {
      // ignore local exports and type imports/exports
      if (node.source == null || node.importKind === 'type' ||
          node.importKind === 'typeof'  || node.exportKind === 'type') {
        return
      }

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

        // ignore type imports
        if (im.importKind === 'type' || im.importKind === 'typeof') return

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
