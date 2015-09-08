export default function (context) {
  const imported = new Map()
  return {
    "ImportDeclaration": function (n) {
      if (imported.has(n.source.value)) {
        imported.get(n.source.value).add(n.source)
      } else {
        imported.set(n.source.value, new Set([n.source]))
      }
    },

    "Program:exit": function () {
      for (let [module, nodes] of imported.entries()) {
        if (nodes.size > 1) {
          for (let node of nodes) {
            context.report(node, `'${module}' imported multiple times.`)
          }
        }
      }
    }
  }
}
