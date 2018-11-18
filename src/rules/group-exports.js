import docsUrl from '../docsUrl'

const meta = {
  type: 'suggestion',
  docs: {
    url: docsUrl('group-exports'),
  },
}
/* eslint-disable max-len */
const errors = {
  ExportNamedDeclaration: 'Multiple named export declarations; consolidate all named exports into a single export declaration',
  AssignmentExpression: 'Multiple CommonJS exports; consolidate all exports into a single assignment to `module.exports`',
}
/* eslint-enable max-len */

/**
 * Returns an array with names of the properties in the accessor chain for MemberExpression nodes
 *
 * Example:
 *
 * `module.exports = {}` => ['module', 'exports']
 * `module.exports.property = true` => ['module', 'exports', 'property']
 *
 * @param     {Node}    node    AST Node (MemberExpression)
 * @return    {Array}           Array with the property names in the chain
 * @private
 */
function accessorChain(node) {
  const chain = []

  do {
    chain.unshift(node.property.name)

    if (node.object.type === 'Identifier') {
      chain.unshift(node.object.name)
      break
    }

    node = node.object
  } while (node.type === 'MemberExpression')

  return chain
}

function create(context) {
  const nodes = {
    modules: new Set(),
    commonjs: new Set(),
  }

  return {
    ExportNamedDeclaration(node) {
      nodes.modules.add(node)
    },

    AssignmentExpression(node) {
      if (node.left.type !== 'MemberExpression') {
        return
      }

      const chain = accessorChain(node.left)

      // Assignments to module.exports
      // Deeper assignments are ignored since they just modify what's already being exported
      // (ie. module.exports.exported.prop = true is ignored)
      if (chain[0] === 'module' && chain[1] === 'exports' && chain.length <= 3) {
        nodes.commonjs.add(node)
        return
      }

      // Assignments to exports (exports.* = *)
      if (chain[0] === 'exports' && chain.length === 2) {
        nodes.commonjs.add(node)
        return
      }
    },

    'Program:exit': function onExit() {
      // Report multiple `export` declarations (ES2015 modules)
      if (nodes.modules.size > 1) {
        nodes.modules.forEach(node => {
          context.report({
            node,
            message: errors[node.type],
          })
        })
      }

      // Report multiple `module.exports` assignments (CommonJS)
      if (nodes.commonjs.size > 1) {
        nodes.commonjs.forEach(node => {
          context.report({
            node,
            message: errors[node.type],
          })
        })
      }
    },
  }
}

module.exports = {
  meta,
  create,
}
