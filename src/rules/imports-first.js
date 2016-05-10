module.exports = function (context) {
  function isPossibleDirective (node) {
    return node.type === 'ExpressionStatement' &&
      node.expression.type === 'Literal' &&
      typeof node.expression.value === 'string'
  }

  return {
    'Program': function (n) {
      const body = n.body
      let nonImportCount = 0
        , anyExpressions = false
      body.forEach(function (node){
        if (!anyExpressions && isPossibleDirective(node)) {
          return
        }

        anyExpressions = true

        if (node.type === 'ImportDeclaration') {
          if (nonImportCount > 0) {
            context.report({
              node,
              message: 'Import in body of module; reorder to top.',
            })
          }
        } else {
          nonImportCount++
        }
      })
    },
  }
}
