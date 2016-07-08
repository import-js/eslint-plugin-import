import Map from 'es6-map'
import Set from 'es6-set'

import resolve from '../core/resolve'

function checkImports(imported, context) {
  imported.forEach((nodes, module) => {
    if (nodes.size > 1) {
      nodes.forEach((node) => {
        context.report(node, `'${module}' imported multiple times.`)
      })
    }
  })
}

module.exports = function (context) {
  const imported = new Map()
  const typesImported = new Map()
  return {
    'ImportDeclaration': function (n) {
      // resolved path will cover aliased duplicates
      const resolvedPath = resolve(n.source.value, context) || n.source.value
      const importMap = n.importKind === 'type' ? typesImported : imported

      if (importMap.has(resolvedPath)) {
        importMap.get(resolvedPath).add(n.source)
      } else {
        importMap.set(resolvedPath, new Set([n.source]))
      }
    },

    'Program:exit': function () {
      checkImports(imported, context)
      checkImports(typesImported, context)
    },
  }
}
