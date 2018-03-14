import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    docs: {
      url: docsUrl('first'),
    },
    fixable: 'code',
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
            , message = 'Import in body of module; reorder to top.'
            , sourceCode = context.getSourceCode()
            , originSourceCode = sourceCode.getText()
            , scopeManager = sourceCode.scopeManager
            , moduleScope = scopeManager.scopes.find(function (scope) {
              return scope.type === 'module'
            })
        let nonImportCount = 0
          , anyExpressions = false
          , anyRelative = false
          , lastLegalImp = null
          , errorInfos = []
        
        body.forEach(function (node, index){
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
              let shouldSort = true
              for (let variable of scopeManager.getDeclaredVariables(node)) {
                const references = variable.references
                if (references.length) {
                  for (let reference of references) {
                    if (reference.identifier.range[0] >= node.range[1]) {
                      break
                    } else if (reference.from === moduleScope) {
                      shouldSort = false
                      break
                    }
                  }
                }
              }
              shouldSort && errorInfos.push({
                node,
                range: [body[index - 1].range[1], node.range[1]],
              })
            } else {
              lastLegalImp = node
            }
          } else {
            nonImportCount++
          }
        })
        if (!errorInfos.length) return
        errorInfos.slice(0, -1).forEach(function (errorInfo) {
          const node = errorInfo.node
          context.report({
            node,
            message,
            // fake fixer
            fix: function (fixer) {
              return fixer.insertTextAfter(node, '')
            },
          })
        })
        context.report({
          node: errorInfos[errorInfos.length - 1].node,
          message,
          // fixers batch
          fix: function (fixer) {
            const removeFixers = errorInfos.map(function (errorInfo) {
                  return fixer.removeRange(errorInfo.range)
                })
                , insertSourceCode = errorInfos.map(function (errorInfo) {
                  const nodeSourceCode = String.prototype.slice.apply(
                    originSourceCode, errorInfo.range
                  )
                  if (/\S/.test(nodeSourceCode[0])) {
                    return '\n' + nodeSourceCode
                  } else {
                    return nodeSourceCode
                  }
                }).join('')
                , insertFixer = lastLegalImp ? 
                                fixer.insertTextAfter(lastLegalImp, insertSourceCode) :
                                fixer.insertTextBefore(body[0], insertSourceCode.trim() + '\n')
            return removeFixers.concat([insertFixer])
          },
        })
      },
    }
  },
}
