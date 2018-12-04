import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
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
        let nonImportCount = 0
          , anyExpressions = false
          , anyRelative = false
          , lastLegalImp = null
          , errorInfos = []
          , shouldSort = true
          , lastSortNodesIndex = 0
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
              for (let variable of context.getDeclaredVariables(node)) {
                if (!shouldSort) break
                const references = variable.references
                if (references.length) {
                  for (let reference of references) {
                    if (reference.identifier.range[0] < node.range[1]) {
                      shouldSort = false
                      break
                    }
                  }
                }
              }
              shouldSort && (lastSortNodesIndex = errorInfos.length)
              errorInfos.push({
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
        errorInfos.forEach(function (errorInfo, index) {
          const node = errorInfo.node
              , infos = {
                node,
                message,
              }
          if (index < lastSortNodesIndex) {
            infos.fix = function (fixer) {
              return fixer.insertTextAfter(node, '')
            }
          } else if (index === lastSortNodesIndex) {
            const sortNodes = errorInfos.slice(0, lastSortNodesIndex + 1)
            infos.fix = function (fixer) {
              const removeFixers = sortNodes.map(function (_errorInfo) {
                    return fixer.removeRange(_errorInfo.range)
                  })
                  , range = [0, removeFixers[removeFixers.length - 1].range[1]]
              let insertSourceCode = sortNodes.map(function (_errorInfo) {
                    const nodeSourceCode = String.prototype.slice.apply(
                      originSourceCode, _errorInfo.range
                    )
                    if (/\S/.test(nodeSourceCode[0])) {
                      return '\n' + nodeSourceCode
                    }
                    return nodeSourceCode
                  }).join('')
                , insertFixer = null
                , replaceSourceCode = ''
              if (!lastLegalImp) {
                  insertSourceCode =
                    insertSourceCode.trim() + insertSourceCode.match(/^(\s+)/)[0]
              }
              insertFixer = lastLegalImp ?
                            fixer.insertTextAfter(lastLegalImp, insertSourceCode) :
                            fixer.insertTextBefore(body[0], insertSourceCode)
              const fixers = [insertFixer].concat(removeFixers)
              fixers.forEach(function (computedFixer, i) {
                replaceSourceCode += (originSourceCode.slice(
                  fixers[i - 1] ? fixers[i - 1].range[1] : 0, computedFixer.range[0]
                ) + computedFixer.text)
              })
              return fixer.replaceTextRange(range, replaceSourceCode)
            }
          }
          context.report(infos)
        })
      },
    }
  },
}
