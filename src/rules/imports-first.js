export default function (context) {
  return {
    "Program": function (n) {
      const body = n.body
      let last = -1
      for (let [i, node] of body.entries()) {
        if (node.type === "ImportDeclaration") {
          if (i === last + 1) {
            last++
          } else {
            context.report(node, 'Import in body of module; reorder to top.')
          }
        }
      }
    }
  }
}
