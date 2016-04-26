/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */

import isStaticRequire from '../core/staticRequire'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

function getLineDifference(node, nextToken) {
  return nextToken.loc.start.line - node.loc.start.line
}

function ensureNoForbiddenKeyword(context, node, tokenToInspect, tokenValue) {
  if (!tokenToInspect) {
    return
  }

  if (getLineDifference(node, tokenToInspect) === 1
    && tokenToInspect.type === 'Keyword' && tokenToInspect.value !== tokenValue)
  {
    context.report({
      loc: tokenToInspect.loc.start,
      message: 'Expected empty line after ' + tokenValue +
        ' statement not followed by another ' + tokenValue + '.',
    })
  }
}

module.exports = function (context) {
  return {
    ImportDeclaration: function (node) {
      const nextToken = context.getSourceCode(node).getTokenAfter(node)

      ensureNoForbiddenKeyword(context, node, nextToken, 'import')
    },
    CallExpression: function(node) {
      if (isStaticRequire(node)) {
        const nextTokens = context.getSourceCode(node).getTokensAfter(node, 2)
        const tokenToInspect = nextTokens.length > 1 && nextTokens[0].type === 'Punctuator'
          ? nextTokens[1]
          : nextTokens[0]

        ensureNoForbiddenKeyword(context, node, tokenToInspect, 'require')
      }
    },
  }
}
