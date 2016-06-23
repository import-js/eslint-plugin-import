/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */

import isStaticRequire from '../core/staticRequire'
import findIndex from 'lodash.findindex'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

function containsNodeOrEqual(outerNode, innerNode) {
    return outerNode.range[0] <= innerNode.range[0] && outerNode.range[1] >= innerNode.range[1]
}

function getScopeBody(scope) {
    if (scope.block.type === 'SwitchStatement') {
      return []
    }

    const { body } = scope.block
    if (body && body.type === 'BlockStatement') {
        return body.body
    }

    return body
}

function findNodeIndexInScopeBody(body, nodeToFind) {
    return findIndex(body, (node) => containsNodeOrEqual(node, nodeToFind))
}

function getLineDifference(node, nextNode) {
  return nextNode.loc.start.line - node.loc.end.line
}


module.exports = function (context) {
  const scopes = []
  let scopeIndex = 0

  function checkForNewLine(node, nextNode, type) {
    if (getLineDifference(node, nextNode) < 2) {
      let column = node.loc.start.column

      if (node.loc.start.line !== node.loc.end.line) {
        column = 0
      }

      context.report({
        loc: {
          line: node.loc.end.line,
          column,
        },
        message: `Expected empty line after ${type} statement not followed by another ${type}.`,
      })
    }
  }

  return {
    ImportDeclaration: function (node) {
      const { parent } = node
      const nodePosition = parent.body.indexOf(node)
      const nextNode = parent.body[nodePosition + 1]

      if (nextNode && nextNode.type !== 'ImportDeclaration') {
        checkForNewLine(node, nextNode, 'import')
      }
    },
    Program: function () {
      scopes.push({ scope: context.getScope(), requireCalls: [] })
    },
    CallExpression: function(node) {
      const scope = context.getScope()
      if (isStaticRequire(node)) {
        const currentScope = scopes[scopeIndex]

        if (scope === currentScope.scope) {
          currentScope.requireCalls.push(node)
        } else {
          scopes.push({ scope, requireCalls: [ node ] })
          scopeIndex += 1
        }
      }
    },
    'Program:exit': function () {
      scopes.forEach(function ({ scope, requireCalls }) {
        requireCalls.forEach(function (node, index) {
          const scopeBody = getScopeBody(scope)
          const nodePosition = findNodeIndexInScopeBody(scopeBody, node)
          const statementWithRequireCall = scopeBody[nodePosition]
          const nextStatement = scopeBody[nodePosition + 1]
          const nextRequireCall = requireCalls[index + 1]

          if (nextRequireCall && containsNodeOrEqual(statementWithRequireCall, nextRequireCall)) {
            return
          }

          if (nextStatement &&
             (!nextRequireCall || !containsNodeOrEqual(nextStatement, nextRequireCall))) {

            checkForNewLine(statementWithRequireCall, nextStatement, 'require')
          }
        })
      })
    },
  }
}
