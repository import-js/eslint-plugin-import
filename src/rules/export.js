import ExportMap, { recursivePatternCapture } from '../ExportMap'
import docsUrl from '../docsUrl'
import includes from 'array-includes'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('export'),
    },
  },

  create: function (context) {
    const named = new Map()

    function addNamed(name, node, type) {
      const key = type ? `${type}:${name}` : name
      let nodes = named.get(key)

      if (nodes == null) {
        nodes = new Set()
        named.set(key, nodes)
      }

      nodes.add(node)
    }

    return {
      'ExportDefaultDeclaration': (node) => addNamed('default', node),

      'ExportSpecifier': function (node) {
        addNamed(node.exported.name, node.exported)
      },

      'ExportNamedDeclaration': function (node) {
        if (node.declaration == null) return

        if (node.declaration.id != null) {
          if (includes([
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
          ], node.declaration.type)) {
            addNamed(node.declaration.id.name, node.declaration.id, 'type')
          } else {
            addNamed(node.declaration.id.name, node.declaration.id)
          }
        }

        if (node.declaration.declarations != null) {
          for (let declaration of node.declaration.declarations) {
            recursivePatternCapture(declaration.id, v => addNamed(v.name, v))
          }
        }
      },

      'ExportAllDeclaration': function (node) {
        if (node.source == null) return // not sure if this is ever true

        const remoteExports = ExportMap.get(node.source.value, context)
        if (remoteExports == null) return

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node)
          return
        }
        let any = false
        remoteExports.forEach((v, name) =>
          name !== 'default' &&
          (any = true) && // poor man's filter
          addNamed(name, node))

        if (!any) {
          context.report(node.source,
            `No named exports found in module '${node.source.value}'.`)
        }
      },

      'Program:exit': function () {
        for (let [name, nodes] of named) {
          if (nodes.size <= 1) continue

          for (let node of nodes) {
            if (name === 'default') {
              context.report(node, 'Multiple default exports.')
            } else context.report(node, `Multiple exports of name '${name}'.`)
          }
        }
      },
    }
  },
}
