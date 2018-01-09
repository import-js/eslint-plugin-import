import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    docs: {
      url: docsUrl('first'),
    },
  },

  create: function (context) {
    function isPossibleDirective (node) {
      return node.type === 'ExpressionStatement' &&
        node.expression.type === 'Literal' &&
        typeof node.expression.value === 'string'
    }

    return {
      'Program': function (n) {
        const body = n.body
            , absoluteFirst = context.options[0] === 'absolute-first'
        let nonImportCount = 0
          , anyExpressions = false
          , anyRelative = false
        body.forEach(function (node){
          if (!anyExpressions && isPossibleDirective(node)) {
            return
          }

          anyExpressions = true

          if (node.type === 'ImportDeclaration') {
            if (absoluteFirst) {
              if (/^\./.test(node.source.value)) {
                anyRelative = true
              } else if (anyRelative) {
                context.report({
                  node: node.source,
                  message: 'Absolute imports should come before relative imports.',
                })
              }
            }
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
  },
}
