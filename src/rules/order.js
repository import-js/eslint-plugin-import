'use strict'

import minimatch from 'minimatch'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'

const defaultGroups = ['builtin', 'external', 'parent', 'sibling', 'index']

// REPORTING AND FIXING

function reverse(array) {
  return array.map(function (v) {
    return {
      name: v.name,
      rank: -v.rank,
      node: v.node,
    }
  }).reverse()
}

function getTokensOrCommentsAfter(sourceCode, node, count) {
  let currentNodeOrToken = node
  const result = []
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentAfter(currentNodeOrToken)
    if (currentNodeOrToken == null) {
      break
    }
    result.push(currentNodeOrToken)
  }
  return result
}

function getTokensOrCommentsBefore(sourceCode, node, count) {
  let currentNodeOrToken = node
  const result = []
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentBefore(currentNodeOrToken)
    if (currentNodeOrToken == null) {
      break
    }
    result.push(currentNodeOrToken)
  }
  return result.reverse()
}

function takeTokensAfterWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsAfter(sourceCode, node, 100)
  const result = []
  for (let i = 0; i < tokens.length; i++) {
    if (condition(tokens[i])) {
      result.push(tokens[i])
    }
    else {
      break
    }
  }
  return result
}

function takeTokensBeforeWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsBefore(sourceCode, node, 100)
  const result = []
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (condition(tokens[i])) {
      result.push(tokens[i])
    }
    else {
      break
    }
  }
  return result.reverse()
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

function findRootNode(node) {
  let parent = node
  while (parent.parent != null && parent.parent.body == null) {
    parent = parent.parent
  }
  return parent
}

function findEndOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensAfterWhile(sourceCode, node, commentOnSameLineAs(node))
  let endOfTokens = tokensToEndOfLine.length > 0
    ? tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1]
    : node.range[1]
  let result = endOfTokens
  for (let i = endOfTokens; i < sourceCode.text.length; i++) {
    if (sourceCode.text[i] === '\n') {
      result = i + 1
      break
    }
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t' && sourceCode.text[i] !== '\r') {
      break
    }
    result = i + 1
  }
  return result
}

function commentOnSameLineAs(node) {
  return token => (token.type === 'Block' ||  token.type === 'Line') &&
      token.loc.start.line === token.loc.end.line &&
      token.loc.end.line === node.loc.end.line
}

function findStartOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensBeforeWhile(sourceCode, node, commentOnSameLineAs(node))
  let startOfTokens = tokensToEndOfLine.length > 0 ? tokensToEndOfLine[0].range[0] : node.range[0]
  let result = startOfTokens
  for (let i = startOfTokens - 1; i > 0; i--) {
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t') {
      break
    }
    result = i
  }
  return result
}

function isPlainRequireModule(node) {
  if (node.type !== 'VariableDeclaration') {
    return false
  }
  if (node.declarations.length !== 1) {
    return false
  }
  const decl = node.declarations[0]
  const result = decl.id &&
    (decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern') &&
    decl.init != null &&
    decl.init.type === 'CallExpression' &&
    decl.init.callee != null &&
    decl.init.callee.name === 'require' &&
    decl.init.arguments != null &&
    decl.init.arguments.length === 1 &&
    decl.init.arguments[0].type === 'Literal'
  return result
}

function isPlainImportModule(node) {
  return node.type === 'ImportDeclaration' && node.specifiers != null && node.specifiers.length > 0
}

function isPlainImportEquals(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference.expression
}

function canCrossNodeWhileReorder(node) {
  return isPlainRequireModule(node) || isPlainImportModule(node) || isPlainImportEquals(node)
}

function canReorderItems(firstNode, secondNode) {
  const parent = firstNode.parent
  const [firstIndex, secondIndex] = [
    parent.body.indexOf(firstNode),
    parent.body.indexOf(secondNode),
  ].sort()
  const nodesBetween = parent.body.slice(firstIndex, secondIndex + 1)
  for (var nodeBetween of nodesBetween) {
    if (!canCrossNodeWhileReorder(nodeBetween)) {
      return false
    }
  }
  return true
}

function fixOutOfOrder(context, firstNode, secondNode, order) {
  const sourceCode = context.getSourceCode()

  const firstRoot = findRootNode(firstNode.node)
  const firstRootStart = findStartOfLineWithComments(sourceCode, firstRoot)
  const firstRootEnd = findEndOfLineWithComments(sourceCode, firstRoot)

  const secondRoot = findRootNode(secondNode.node)
  const secondRootStart = findStartOfLineWithComments(sourceCode, secondRoot)
  const secondRootEnd = findEndOfLineWithComments(sourceCode, secondRoot)
  const canFix = canReorderItems(firstRoot, secondRoot)

  let newCode = sourceCode.text.substring(secondRootStart, secondRootEnd)
  if (newCode[newCode.length - 1] !== '\n') {
    newCode = newCode + '\n'
  }

  const message = '`' + secondNode.name + '` import should occur ' + order +
      ' import of `' + firstNode.name + '`'

  if (order === 'before') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
        fixer.replaceTextRange(
          [firstRootStart, secondRootEnd],
          newCode + sourceCode.text.substring(firstRootStart, secondRootStart)
        )),
    })
  } else if (order === 'after') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
        fixer.replaceTextRange(
          [secondRootStart, firstRootEnd],
          sourceCode.text.substring(secondRootEnd, firstRootEnd) + newCode
        )),
    })
  }
}

function reportOutOfOrder(context, imported, outOfOrder, order) {
  outOfOrder.forEach(function (imp) {
    const found = imported.find(function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank
    })
    fixOutOfOrder(context, found, imp, order)
  })
}

function makeOutOfOrderReport(context, imported) {
  const outOfOrder = findOutOfOrder(imported)
  if (!outOfOrder.length) {
    return
  }
  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported)
  const reversedOrder = findOutOfOrder(reversedImported)
  if (reversedOrder.length < outOfOrder.length) {
    reportOutOfOrder(context, reversedImported, reversedOrder, 'after')
    return
  }
  reportOutOfOrder(context, imported, outOfOrder, 'before')
}

function getSorter(ascending) {
  let multiplier = (ascending ? 1 : -1)

  return function importsSorter(importA, importB) {
    let result

    if ((importA < importB) || importB === null) {
      result = -1
    } else if ((importA > importB) || importA === null) {
      result = 1
    } else {
      result = 0
    }

    return result * multiplier
  }
}

function mutateRanksToAlphabetize(imported, alphabetizeOptions) {
  const groupedByRanks = imported.reduce(function(acc, importedItem) {
    if (!Array.isArray(acc[importedItem.rank])) {
      acc[importedItem.rank] = []
    }
    acc[importedItem.rank].push(importedItem.name)
    return acc
  }, {})

  const groupRanks = Object.keys(groupedByRanks)

  const sorterFn = getSorter(alphabetizeOptions.order === 'asc')
  const comparator = alphabetizeOptions.caseInsensitive ? (a, b) => sorterFn(String(a).toLowerCase(), String(b).toLowerCase()) : (a, b) => sorterFn(a, b)
  // sort imports locally within their group
  groupRanks.forEach(function(groupRank) {
    groupedByRanks[groupRank].sort(comparator)
  })

  // assign globally unique rank to each import
  let newRank = 0
  const alphabetizedRanks = groupRanks.sort().reduce(function(acc, groupRank) {
    groupedByRanks[groupRank].forEach(function(importedItemName) {
      acc[importedItemName] = parseInt(groupRank, 10) + newRank
      newRank += 1
    })
    return acc
  }, {})

  // mutate the original group-rank with alphabetized-rank
  imported.forEach(function(importedItem) {
    importedItem.rank = alphabetizedRanks[importedItem.name]
  })
}

// DETECTING

function computePathRank(ranks, pathGroups, path, maxPosition) {
  for (let i = 0, l = pathGroups.length; i < l; i++) {
    const { pattern, patternOptions, group, position = 1 } = pathGroups[i]
    if (minimatch(path, pattern, patternOptions || { nocomment: true })) {
      return ranks[group] + (position / maxPosition)
    }
  }
}

function computeRank(context, ranks, name, type, excludedImportTypes) {
  const impType = importType(name, context)
  let rank
  if (!excludedImportTypes.has(impType)) {
    rank = computePathRank(ranks.groups, ranks.pathGroups, name, ranks.maxPosition)
  }
  if (typeof rank === 'undefined') {
    rank = ranks.groups[impType]
  }
  if (type !== 'import') {
    rank += 100
  }

  return rank
}

function registerNode(context, node, name, type, ranks, imported, excludedImportTypes) {
  const rank = computeRank(context, ranks, name, type, excludedImportTypes)
  if (rank !== -1) {
    imported.push({name, rank, node})
  }
}

function isInVariableDeclarator(node) {
  return node &&
    (node.type === 'VariableDeclarator' || isInVariableDeclarator(node.parent))
}

const types = ['builtin', 'external', 'internal', 'unknown', 'parent', 'sibling', 'index']

// Creates an object with type-rank pairs.
// Example: { index: 0, sibling: 1, parent: 1, external: 1, builtin: 2, internal: 2 }
// Will throw an error if it contains a type that does not exist, or has a duplicate
function convertGroupsToRanks(groups) {
  const rankObject = groups.reduce(function(res, group, index) {
    if (typeof group === 'string') {
      group = [group]
    }
    group.forEach(function(groupItem) {
      if (res[groupItem] !== undefined) {
        throw new Error('Incorrect configuration of the rule: `' + groupItem + '` is duplicated')
      }
      res[groupItem] = index
    })
    return res
  }, {})

  const omittedTypes = types.filter(function(type) {
    return rankObject[type] === undefined
  })

  return omittedTypes.reduce(function(res, type) {
    res[type] = groups.length
    return res
  }, rankObject)
}

function convertPathGroupsForRanks(pathGroups) {
  const after = {}
  const before = {}

  const transformed = pathGroups.map((pathGroup, index) => {
    const { group, position: positionString } = pathGroup
    let position = 0
    if (positionString === 'after') {
      if (!after[group]) {
        after[group] = 1
      }
      position = after[group]++
    } else if (positionString === 'before') {
      if (!before[group]) {
        before[group] = []
      }
      before[group].push(index)
    }

    return Object.assign({}, pathGroup, { position })
  })

  let maxPosition = 1

  Object.keys(before).forEach((group) => {
    const groupLength = before[group].length
    before[group].forEach((groupIndex, index) => {
      transformed[groupIndex].position = -1 * (groupLength - index)
    })
    maxPosition = Math.max(maxPosition, groupLength)
  })

  Object.keys(after).forEach((key) => {
    const groupNextPosition = after[key]
    maxPosition = Math.max(maxPosition, groupNextPosition - 1)
  })

  return {
    pathGroups: transformed,
    maxPosition: maxPosition > 10 ? Math.pow(10, Math.ceil(Math.log10(maxPosition))) : 10,
  }
}

function fixNewLineAfterImport(context, previousImport) {
  const prevRoot = findRootNode(previousImport.node)
  const tokensToEndOfLine = takeTokensAfterWhile(
    context.getSourceCode(), prevRoot, commentOnSameLineAs(prevRoot))

  let endOfLine = prevRoot.range[1]
  if (tokensToEndOfLine.length > 0) {
    endOfLine = tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1]
  }
  return (fixer) => fixer.insertTextAfterRange([prevRoot.range[0], endOfLine], '\n')
}

function removeNewLineAfterImport(context, currentImport, previousImport) {
  const sourceCode = context.getSourceCode()
  const prevRoot = findRootNode(previousImport.node)
  const currRoot = findRootNode(currentImport.node)
  const rangeToRemove = [
    findEndOfLineWithComments(sourceCode, prevRoot),
    findStartOfLineWithComments(sourceCode, currRoot),
  ]
  if (/^\s*$/.test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    return (fixer) => fixer.removeRange(rangeToRemove)
  }
  return undefined
}

function makeNewlinesBetweenReport (context, imported, newlinesBetweenImports) {
  const getNumberOfEmptyLinesBetween = (currentImport, previousImport) => {
    const linesBetweenImports = context.getSourceCode().lines.slice(
      previousImport.node.loc.end.line,
      currentImport.node.loc.start.line - 1
    )

    return linesBetweenImports.filter((line) => !line.trim().length).length
  }
  let previousImport = imported[0]

  imported.slice(1).forEach(function(currentImport) {
    const emptyLinesBetween = getNumberOfEmptyLinesBetween(currentImport, previousImport)

    if (newlinesBetweenImports === 'always'
        || newlinesBetweenImports === 'always-and-inside-groups') {
      if (currentImport.rank !== previousImport.rank && emptyLinesBetween === 0) {
        context.report({
          node: previousImport.node,
          message: 'There should be at least one empty line between import groups',
          fix: fixNewLineAfterImport(context, previousImport),
        })
      } else if (currentImport.rank === previousImport.rank
        && emptyLinesBetween > 0
        && newlinesBetweenImports !== 'always-and-inside-groups') {
        context.report({
          node: previousImport.node,
          message: 'There should be no empty line within import group',
          fix: removeNewLineAfterImport(context, currentImport, previousImport),
        })
      }
    } else if (emptyLinesBetween > 0) {
      context.report({
        node: previousImport.node,
        message: 'There should be no empty line between import groups',
        fix: removeNewLineAfterImport(context, currentImport, previousImport),
      })
    }

    previousImport = currentImport
  })
}

function getAlphabetizeConfig(options) {
  const alphabetize = options.alphabetize || {}
  const order = alphabetize.order || 'ignore'
  const caseInsensitive = alphabetize.caseInsensitive || false

  return {order, caseInsensitive}
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('order'),
    },

    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          groups: {
            type: 'array',
          },
          pathGroupsExcludedImportTypes: {
            type: 'array',
          },
          pathGroups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                },
                patternOptions: {
                  type: 'object',
                },
                group: {
                  type: 'string',
                  enum: types,
                },
                position: {
                  type: 'string',
                  enum: ['after', 'before'],
                },
              },
              required: ['pattern', 'group'],
            },
          },
          'newlines-between': {
            enum: [
              'ignore',
              'always',
              'always-and-inside-groups',
              'never',
            ],
          },
          alphabetize: {
            type: 'object',
            properties: {
              caseInsensitive: {
                type: 'boolean',
                default: false,
              },
              order: {
                enum: ['ignore', 'asc', 'desc'],
                default: 'ignore',
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function importOrderRule (context) {
    const options = context.options[0] || {}
    const newlinesBetweenImports = options['newlines-between'] || 'ignore'
    const pathGroupsExcludedImportTypes = new Set(options['pathGroupsExcludedImportTypes'] || ['builtin', 'external'])
    const alphabetize = getAlphabetizeConfig(options)
    let ranks

    try {
      const { pathGroups, maxPosition } = convertPathGroupsForRanks(options.pathGroups || [])
      ranks = {
        groups: convertGroupsToRanks(options.groups || defaultGroups),
        pathGroups,
        maxPosition,
      }
    } catch (error) {
      // Malformed configuration
      return {
        Program: function(node) {
          context.report(node, error.message)
        },
      }
    }
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
          registerNode(
            context,
            node,
            name,
            'import',
            ranks,
            imported,
            pathGroupsExcludedImportTypes
          )
        }
      },
      TSImportEqualsDeclaration: function handleImports(node) {
        let name
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          name = node.moduleReference.expression.value
        } else {
          name = null
        }
        registerNode(
          context,
          node,
          name,
          'import',
          ranks,
          imported,
          pathGroupsExcludedImportTypes
        )
      },
      CallExpression: function handleRequires(node) {
        if (level !== 0 || !isStaticRequire(node) || !isInVariableDeclarator(node.parent)) {
          return
        }
        const name = node.arguments[0].value
        registerNode(
          context,
          node,
          name,
          'require',
          ranks,
          imported,
          pathGroupsExcludedImportTypes
        )
      },
      'Program:exit': function reportAndReset() {
        if (newlinesBetweenImports !== 'ignore') {
          makeNewlinesBetweenReport(context, imported, newlinesBetweenImports)
        }

        if (alphabetize.order !== 'ignore') {
          mutateRanksToAlphabetize(imported, alphabetize)
        }

        makeOutOfOrderReport(context, imported)

        imported = []
      },
      FunctionDeclaration: incrementLevel,
      FunctionExpression: incrementLevel,
      ArrowFunctionExpression: incrementLevel,
      BlockStatement: incrementLevel,
      ObjectExpression: incrementLevel,
      'FunctionDeclaration:exit': decrementLevel,
      'FunctionExpression:exit': decrementLevel,
      'ArrowFunctionExpression:exit': decrementLevel,
      'BlockStatement:exit': decrementLevel,
      'ObjectExpression:exit': decrementLevel,
    }
  },
}
