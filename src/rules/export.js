import ExportMap, { recursivePatternCapture } from '../core/getExports'

module.exports = function (context) {
  const defaults = new Set()
      , named = new Map()

  function addNamed(name, node) {
    let nodes = named.get(name)

    if (nodes == null) {
      nodes = new Set()
      named.set(name, nodes)
    }

    nodes.add(node)
  }

  return {
    'ExportDefaultDeclaration': function (node) {
      defaults.add(node)
    },

    'ExportSpecifier': function (node) {
      addNamed(node.exported.name, node.exported)
    },

    'ExportNamedDeclaration': function (node) {
      if (node.declaration == null) return

      if (node.declaration.id != null) {
        addNamed(node.declaration.id.name, node.declaration.id)
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
        context.report({
          node: node.source,
          message: `Parse errors in imported module ` +
                   `'${node.source.value}'.`,
        })
        return
      }

      if (!remoteExports.hasNamed) {
        context.report(node.source,
          `No named exports found in module '${node.source.value}'.`)
      }

      for (let [name] of remoteExports.named) {
        addNamed(name, node)
      }
    },

    'Program:exit': function () {
      if (defaults.size > 1) {
        for (let node of defaults) {
          context.report(node, 'Multiple default exports.')
        }
      }

      for (let [name, nodes] of named) {
        if (nodes.size <= 1) continue

        for (let node of nodes) {
          context.report(node, `Multiple exports of name '${name}'.`)
        }
      }
    },
  }
}
