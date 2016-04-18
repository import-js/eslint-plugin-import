module.exports = function (context) {
  return {
    'Program': function (n) {
      const body = n.body
          , absoluteFirst = context.options.indexOf('absolute-first') !== -1
          , absoluteFirstGroup = context.options.indexOf('absolute-first-group') !== -1
      let last = -1
        , anyRelative = false
      body.forEach(function (node, i){
        if (node.type === 'ImportDeclaration') {
          if (absoluteFirst) {
            if (/^\./.test(node.source.value)) {
              anyRelative = true
            } else if (anyRelative) {
              context.report({
                node: node.source,
                message: 'Absolute imports should come before relative imports.',
              })

              const prevToken = context.getSourceCode(node).getTokenBefore(node)
              if (absoluteFirstGroup && (node.loc.start.line - prevToken.loc.start.line !== 2)) {
                context.report({
                  node: node.source,
                  message: 'There should be one empty line between ' +
                           'absolute and relative import sections.',
                })
              }
            }
          }
          if (i !== ++last) {
            context.report({
              node,
              message: 'Import in body of module; reorder to top.',
            })
          }
        }
      })
    },
  }
}
