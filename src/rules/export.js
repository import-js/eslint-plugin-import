import Map from 'es6-map'
import Set from 'es6-set'

import ExportMap, { recursivePatternCapture } from '../core/getExports'

module.exports = function (context) {
  const named = new Map()

  function addNamed(name, node) {
    let nodes = named.get(name)

    if (nodes == null) {
      nodes = new Set()
      named.set(name, nodes)
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
        addNamed(node.declaration.id.name, node.declaration.id)
      }

      if (node.declaration.declarations == null) return

      node.declaration.declarations.forEach(declaration => {
        recursivePatternCapture(declaration.id, v => addNamed(v.name, v))
      })
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
      named.forEach((nodes, name) => {
        if (nodes.size <= 1) return

        nodes.forEach(node => {
          if (name === 'default') {
            context.report(node, 'Multiple default exports.')
          } else context.report(node, `Multiple exports of name '${name}'.`)
        })
      })
    },
  }
}
