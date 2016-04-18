'use strict'

import find from 'lodash.find'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

const defaultOrder = ['builtin', 'external', 'parent', 'sibling', 'index']

// REPORTING

function reverse(array) {
  return array.map(function (v) {
    return {
      name: v.name,
      rank: -v.rank,
      node: v.node,
    }
  }).reverse()
}

function findOutOfOrder(imported) {
  if (imported.length === 0) {
    return []
  }
  let maxSeenRankNode = imported[0]
  return imported.filter(function (importedModule) {
    const res = importedModule.rank < maxSeenRankNode.rank
    if (maxSeenRankNode.rank < importedModule.rank) {
      maxSeenRankNode = importedModule
    }
    return res
  })
}

function report(context, imported, outOfOrder, order) {
  outOfOrder.forEach(function (imp) {
    const found = find(imported, function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank
    })
    context.report(imp.node, '`' + imp.name + '` import should occur ' + order +
      ' import of `' + found.name + '`')
  })
}

function makeReport(context, imported) {
  const outOfOrder = findOutOfOrder(imported)
  if (!outOfOrder.length) {
    return
  }
  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported)
  const reversedOrder = findOutOfOrder(reversedImported)
  if (reversedOrder.length < outOfOrder.length) {
    report(context, reversedImported, reversedOrder, 'after')
    return
  }
  report(context, imported, outOfOrder, 'before')
}

// DETECTING

function computeRank(context, order, name) {
  return order.indexOf(importType(name, context))
}

function registerNode(context, node, name, order, imported) {
  const rank = computeRank(context, order, name)
  if (rank !== -1) {
    imported.push({name: name, rank: rank, node: node})
  }
}

function isInVariableDeclarator(node) {
  return node &&
    (node.type === 'VariableDeclarator' || isInVariableDeclarator(node.parent))
}

module.exports = function importOrderRule (context) {
  const options = context.options[0] || {}
  const order = options.order || defaultOrder
  let imported = []
  let level = 0

  function incrementLevel() {
    level++
  }
  function decrementLevel() {
    level--
  }

  return {
    ImportDeclaration: function handleImports(node) {
      if (node.specifiers.length) { // Ignoring unassigned imports
        const name = node.source.value
        registerNode(context, node, name, order, imported)
      }
    },
    CallExpression: function handleRequires(node) {
      if (level !== 0 || !isStaticRequire(node) || !isInVariableDeclarator(node.parent)) {
        return
      }
      const name = node.arguments[0].value
      registerNode(context, node, name, order, imported)
    },
    'Program:exit': function reportAndReset() {
      makeReport(context, imported)
      imported = []
    },
    FunctionDeclaration: incrementLevel,
    FunctionExpression: incrementLevel,
    ArrowFunctionExpression: incrementLevel,
    BlockStatement: incrementLevel,
    'FunctionDeclaration:exit': decrementLevel,
    'FunctionExpression:exit': decrementLevel,
    'ArrowFunctionExpression:exit': decrementLevel,
    'BlockStatement:exit': decrementLevel,
  }
}

module.exports.schema = [
  {
    type: 'object',
    properties: {
      order: {
        type: 'array',
        uniqueItems: true,
        length: 5,
        items: {
          enum: defaultOrder,
        },
      },
    },
    additionalProperties: false,
  },
]
