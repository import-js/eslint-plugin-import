import resolve from 'eslint-module-utils/resolve'

function checkImports(imported, context) {
  for (let [module, nodes] of imported.entries()) {
    if (nodes.size > 1) {
      for (let node of nodes) {
        context.report(node, `'${module}' imported multiple times.`)
      }
    }
  }
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
