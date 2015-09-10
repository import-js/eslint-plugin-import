export default function (context) {
  return {
    "Program": function (n) {
      const body = n.body
          , absoluteFirst = context.options[0] === 'absolute-first'
      let last = -1
        , anyRelative = false
      body.forEach(function (node, i){
        if (node.type === "ImportDeclaration") {
          if (absoluteFirst) {
            if (/^\./.test(node.source.value)) {
              anyRelative = true
            } else if (anyRelative) {
              context.report(node.source, 'Absolute imports should come before relative imports.')
            }
          }
          if (i !== ++last) {
            context.report(node, 'Import in body of module; reorder to top.')
          }
        }
      })
    }
  }
}
