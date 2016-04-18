/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

function getLineDifference(node, nextToken) {
  return nextToken.loc.start.line - node.loc.start.line
}

module.exports = function (context) {
  return {
    'ImportDeclaration': function (node) {
      const nextToken = context.getSourceCode(node).getTokenAfter(node)

      if (!nextToken) {
        return
      }

      if (getLineDifference(node, nextToken) === 1
          && nextToken.type === 'Keyword' && nextToken.value !== 'import')
      {
        context.report({
          loc: nextToken.loc.start,
          message: 'Expected empty line after import statement not followed by another import.',
        })
      }
    },
  }
}
