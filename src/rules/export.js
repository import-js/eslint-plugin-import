import ExportMap from '../core/getExports'

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

  function recursivePatternCapture(pattern) {
    switch (pattern.type) {
      case 'ObjectPattern':
        captureObject(pattern); break
      case 'ArrayPattern':
        captureArray(pattern); break
    }
  }

  function captureObject({ properties }) {
    properties.forEach(({ value }) => {
      if (value.type === 'Identifier') {
        addNamed(value.name, value)
      } else {
        // must be a deeper pattern
        recursivePatternCapture(value)
      }
    })
  }

  function captureArray({ elements }) {
    elements.forEach((element) => {
      if (element == null) return
      if (element.type === 'Identifier') addNamed(element.name, element)
      else recursivePatternCapture(element)
    })
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
          switch(declaration.id.type) {
            case 'Identifier':
              addNamed(declaration.id.name, declaration.id)
              break
            case 'ObjectPattern':
            case 'ArrayPattern':
              recursivePatternCapture(declaration.id)
              break
          }
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

      for (let name of remoteExports.named) {
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
