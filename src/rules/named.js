import * as path from 'path'
import Exports from '../ExportMap'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    docs: {
      url: docsUrl('named'),
    },
    schema : [{
      type: 'object',
      properties: {
        commonjs: {
          oneOf: [
            { type: 'boolean' },
            {
              type: 'object',
              properties: {
                require: { type: 'boolean' },
                exports: { type: 'boolean' },
              },
            },
          ],
        },
      },
      additionalProperties: false,
    }],
  },

  create: function (context) {
    const options = context.options[0] || {}
    const { commonjs = {} } = options
    const useCommonjsExports = typeof commonjs === 'boolean' ? commonjs : commonjs.exports

    function checkSpecifiers(key, type, node) {
      // ignore local exports and type imports
      if (node.source == null || node.importKind === 'type') return

      if (!node.specifiers
            .some(function (im) { return im.type === type })) {
        return // no named imports/exports
      }

      const exportsOptions = {
        useCommonjsExports,
        noInterop: false, // this should only be true when using require() calls
      }

      const imports = Exports.get(node.source.value, context, exportsOptions)
      if (imports == null) return

      if (imports.errors.length) {
        imports.reportErrors(context, node)
        return
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== type) return

        // ignore type imports
        if (im.importKind === 'type') return

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
