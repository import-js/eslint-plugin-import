'use strict';

import minimatch from 'minimatch';
import includes from 'array-includes';
import flat from 'array.prototype.flat';

import resolveImportType from '../core/importType';
import isStaticRequire from '../core/staticRequire';
import docsUrl from '../docsUrl';

const defaultGroups = ['builtin', 'external', 'parent', 'sibling', 'index'];

// REPORTING AND FIXING

function reverse(array) {
  return array.map(function (v) {
    return Object.assign({}, v, { rank: -v.rank });
  }).reverse();
}

function getTokensOrCommentsAfter(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentAfter(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result;
}

function getTokensOrCommentsBefore(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentBefore(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result.reverse();
}

function takeTokensAfterWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsAfter(sourceCode, node, 100);
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else {
      break;
    }
  }
  return result;
}

function takeTokensBeforeWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsBefore(sourceCode, node, 100);
  const result = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else {
      break;
    }
  }
  return result.reverse();
}

function findOutOfOrder(imported) {
  if (imported.length === 0) {
    return [];
  }
  let maxSeenRankNode = imported[0];
  return imported.filter(function (importedModule) {
    const res = importedModule.rank < maxSeenRankNode.rank;
    if (maxSeenRankNode.rank < importedModule.rank) {
      maxSeenRankNode = importedModule;
    }
    return res;
  });
}

function findRootNode(node) {
  let parent = node;
  while (parent.parent != null && parent.parent.body == null) {
    parent = parent.parent;
  }
  return parent;
}

function findEndOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensAfterWhile(sourceCode, node, commentOnSameLineAs(node));
  const endOfTokens = tokensToEndOfLine.length > 0
    ? tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1]
    : node.range[1];
  let result = endOfTokens;
  for (let i = endOfTokens; i < sourceCode.text.length; i++) {
    if (sourceCode.text[i] === '\n') {
      result = i + 1;
      break;
    }
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t' && sourceCode.text[i] !== '\r') {
      break;
    }
    result = i + 1;
  }
  return result;
}

function commentOnSameLineAs(node) {
  return token => (token.type === 'Block' ||  token.type === 'Line') &&
      token.loc.start.line === token.loc.end.line &&
      token.loc.end.line === node.loc.end.line;
}

function findStartOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensBeforeWhile(sourceCode, node, commentOnSameLineAs(node));
  const startOfTokens = tokensToEndOfLine.length > 0 ? tokensToEndOfLine[0].range[0] : node.range[0];
  let result = startOfTokens;
  for (let i = startOfTokens - 1; i > 0; i--) {
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t') {
      break;
    }
    result = i;
  }
  return result;
}

function isRequireExpression(expr) {
  return expr != null &&
    expr.type === 'CallExpression' &&
    expr.callee != null &&
    expr.callee.name === 'require' &&
    expr.arguments != null &&
    expr.arguments.length === 1 &&
    expr.arguments[0].type === 'Literal';
}

function isSupportedRequireModule(node) {
  if (node.type !== 'VariableDeclaration') {
    return false;
  }
  if (node.declarations.length !== 1) {
    return false;
  }
  const decl = node.declarations[0];
  const isPlainRequire = decl.id &&
    (decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern') &&
    isRequireExpression(decl.init);
  const isRequireWithMemberExpression = decl.id &&
    (decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern') &&
    decl.init != null &&
    decl.init.type === 'CallExpression' &&
    decl.init.callee != null &&
    decl.init.callee.type === 'MemberExpression' &&
    isRequireExpression(decl.init.callee.object);
  return isPlainRequire || isRequireWithMemberExpression;
}

function isPlainImportModule(node) {
  return node.type === 'ImportDeclaration' && node.specifiers != null && node.specifiers.length > 0;
}

function isPlainImportEquals(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference.expression;
}

function canCrossNodeWhileReorder(node) {
  return isSupportedRequireModule(node) || isPlainImportModule(node) || isPlainImportEquals(node);
}

function canReorderItems(firstNode, secondNode) {
  const parent = firstNode.parent;
  const [firstIndex, secondIndex] = [
    parent.body.indexOf(firstNode),
    parent.body.indexOf(secondNode),
  ].sort();
  const nodesBetween = parent.body.slice(firstIndex, secondIndex + 1);
  for (const nodeBetween of nodesBetween) {
    if (!canCrossNodeWhileReorder(nodeBetween)) {
      return false;
    }
  }
  return true;
}

function makeImportDescription(node) {
  if (node.node.importKind === 'type') {
    return 'type import';
  }
  if (node.node.importKind === 'typeof') {
    return 'typeof import';
  }
  return 'import';
}

function fixOutOfOrder(context, firstNode, secondNode, order) {
  const sourceCode = context.getSourceCode();

  const firstRoot = findRootNode(firstNode.node);
  const firstRootStart = findStartOfLineWithComments(sourceCode, firstRoot);
  const firstRootEnd = findEndOfLineWithComments(sourceCode, firstRoot);

  const secondRoot = findRootNode(secondNode.node);
  const secondRootStart = findStartOfLineWithComments(sourceCode, secondRoot);
  const secondRootEnd = findEndOfLineWithComments(sourceCode, secondRoot);
  const canFix = canReorderItems(firstRoot, secondRoot);

  let newCode = sourceCode.text.substring(secondRootStart, secondRootEnd);
  if (newCode[newCode.length - 1] !== '\n') {
    newCode = newCode + '\n';
  }

  const firstImport = `${makeImportDescription(firstNode)} of \`${firstNode.displayName}\``;
  const secondImport = `\`${secondNode.displayName}\` ${makeImportDescription(secondNode)}`;
  const message = `${secondImport} should occur ${order} ${firstImport}`;

  if (order === 'before') {
    context.report({
      node: secondNode.node,
      message,
      fix: canFix && (fixer =>
        fixer.replaceTextRange(
          [firstRootStart, secondRootEnd],
          newCode + sourceCode.text.substring(firstRootStart, secondRootStart),
        )),
    });
  } else if (order === 'after') {
    context.report({
      node: secondNode.node,
      message,
      fix: canFix && (fixer =>
        fixer.replaceTextRange(
          [secondRootStart, firstRootEnd],
          sourceCode.text.substring(secondRootEnd, firstRootEnd) + newCode,
        )),
    });
  }
}

function reportOutOfOrder(context, imported, outOfOrder, order) {
  outOfOrder.forEach(function (imp) {
    const found = imported.find(function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank;
    });
    fixOutOfOrder(context, found, imp, order);
  });
}

function makeOutOfOrderReport(context, imported) {
  const outOfOrder = findOutOfOrder(imported);
  if (!outOfOrder.length) {
    return;
  }
  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported);
  const reversedOrder = findOutOfOrder(reversedImported);
  if (reversedOrder.length < outOfOrder.length) {
    reportOutOfOrder(context, reversedImported, reversedOrder, 'after');
    return;
  }
  reportOutOfOrder(context, imported, outOfOrder, 'before');
}

const compareString = (a, b) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

/** Some parsers (languages without types) don't provide ImportKind */
const DEAFULT_IMPORT_KIND = 'value';
const getNormalizedValue = (node, toLowerCase) => {
  const value = node.value;
  return toLowerCase ? String(value).toLowerCase() : value;
};

function getSorter(alphabetizeOptions) {
  const multiplier = alphabetizeOptions.order === 'asc' ? 1 : -1;
  const orderImportKind = alphabetizeOptions.orderImportKind;
  const multiplierImportKind = orderImportKind !== 'ignore' &&
    (alphabetizeOptions.orderImportKind === 'asc' ? 1 : -1);

  return function importsSorter(nodeA, nodeB) {
    const importA = getNormalizedValue(nodeA, alphabetizeOptions.caseInsensitive);
    const importB = getNormalizedValue(nodeB, alphabetizeOptions.caseInsensitive);
    let result = 0;

    if (!includes(importA, '/') && !includes(importB, '/')) {
      result = compareString(importA, importB);
    } else {
      const A = importA.split('/');
      const B = importB.split('/');
      const a = A.length;
      const b = B.length;

      for (let i = 0; i < Math.min(a, b); i++) {
        result = compareString(A[i], B[i]);
        if (result) break;
      }

      if (!result && a !== b) {
        result = a < b ? -1 : 1;
      }
    }

    result = result * multiplier;

    // In case the paths are equal (result === 0), sort them by importKind
    if (!result && multiplierImportKind) {
      result = multiplierImportKind * compareString(
        nodeA.node.importKind || DEAFULT_IMPORT_KIND,
        nodeB.node.importKind || DEAFULT_IMPORT_KIND,
      );
    }

    return result;
  };
}

function mutateRanksForIntraGroupOrdering(computedContext, imported, groups, intraGroupOrdering, alphabetizeOptions) {
  const { omittedTypes } = computedContext;

  const nonTypeGroups = new Set(flat(groups));
  if (intraGroupOrdering) {
    nonTypeGroups.delete('type');

    if (omittedTypes.size) {
      nonTypeGroups.add('unknown');
    }
  }

  let groupIndexMap = {};
  if (intraGroupOrdering) {
    // map of indices of each import type in the original groups array
    groupIndexMap = groups.reduce(function (acc, group, idx) {
      if (typeof group === 'string') {
        acc[group] = idx;
      } else if (Array.isArray(group)) {
        for (const groupItem of group) {
          acc[groupItem] = idx;
        }
      }

      return acc;
    }, groupIndexMap);
  }

  const groupedByRanks = imported.reduce(function (acc, importedItem) {
    const { rank, groupType, pathType } = importedItem;

    if (
      !intraGroupOrdering ||
      (intraGroupOrdering && (omittedTypes.has(groupType) || !includes(types, pathType)))
    ) {
      if (!Array.isArray(acc[rank])) {
        acc[rank] = [[]];
      }

      acc[rank][0].push(importedItem);
    } else if (intraGroupOrdering) {
      // index of the import type in the original groups array
      const groupsIndex = groupIndexMap[groupType];
      let group = Array.isArray(groups[groupsIndex]) ? groups[groupsIndex] : [groups[groupsIndex]];

      if (groupType === 'type') {
        if (omittedTypes.size) {
          nonTypeGroups.add('unknown');
        }

        // sort type imports in the same order groups are sorted in but without newlines
        group = Array.from(nonTypeGroups);
      }

      if (!Array.isArray(acc[rank])) {
        acc[rank] = Array.from({ length: group.length }, function () {
          return [];
        });
      }

      let groupIdx;
      if (groupType === 'type') {
        groupIdx = group.indexOf(pathType);

        if (groupIdx === -1) {
        // if a type isn't specified, put in in the `unknown` group
          groupIdx = group.length - 1;
        }
      } else {
        groupIdx = group.indexOf(groupType);
      }

      acc[rank][groupIdx].push(importedItem);
    }

    return acc;
  }, {});


  // sort group keys so that they can be iterated on in order
  const groupRanks = Object.keys(groupedByRanks).sort(function (a, b) {
    return a - b;
  });

  if (alphabetizeOptions.order !== 'ignore') {
    const sorterFn = getSorter(alphabetizeOptions);
  
    // sort imports locally within their group
    for (const groupRank of groupRanks) {
      for (const importedGroup of groupedByRanks[groupRank]) {
        importedGroup.sort(sorterFn);
      }
    }
  }

  // assign globally unique rank to each import
  let newRank = 0;
  const mutatedRanks = groupRanks.reduce(function (acc, groupRank) {
    for (const importedGroup of groupedByRanks[groupRank]) {
      for (const importedItem of importedGroup) {
        acc[`${importedItem.value}|${importedItem.node.importKind}`] = parseInt(groupRank, 10) + newRank;
        newRank += 1;
      }
    }
    return acc;
  }, {});

  // mutate the original group-rank with alphabetized-rank
  imported.forEach(function (importedItem) {
    importedItem.rank = mutatedRanks[`${importedItem.value}|${importedItem.node.importKind}`];
  });
}

// DETECTING

function computePathGroupRank(ranks, pathGroups, path, maxPosition) {
  for (let i = 0, l = pathGroups.length; i < l; i++) {
    const { pattern, patternOptions, group, position = 1 } = pathGroups[i];
    if (minimatch(path, pattern, patternOptions || { nocomment: true })) {
      return [ranks[group] + (position / maxPosition), group];
    }
  }
}

function computeRank(context, computedContext, importEntry, excludedImportTypes) {
  let rank;
  let groupType; // the assigned group type of the import
  let pathType; // the computed type of the import's path with no other modifiers (used for sorting type imports)
  
  if (importEntry.type === 'import:object') {
    groupType = 'object';
  } else {
    groupType = resolveImportType(importEntry.value, context);
    pathType = groupType;
  }

  if (importEntry.node.importKind === 'type' && !computedContext.omittedTypes.has('type')) {
    groupType = 'type';
  }

  if (!excludedImportTypes.has(groupType)) {
    const pathGroupRank = computePathGroupRank(computedContext.ranks, computedContext.pathGroups, importEntry.value, computedContext.maxPosition);
    if (pathGroupRank) {
      [rank, groupType] = pathGroupRank;
      pathType = groupType;
    }
  }

  if (typeof rank === 'undefined') {
    rank = computedContext.ranks[groupType];
  }

  if (importEntry.type !== 'import' && !importEntry.type.startsWith('import:')) {
    rank += 100;
  }

  return { rank, groupType, pathType };
}

function registerNode(context, importEntry, computedContext, imported, excludedImportTypes) {
  const computedRank = computeRank(context, computedContext, importEntry, excludedImportTypes);
  if (computedRank.rank !== -1) {
    imported.push(Object.assign({}, importEntry, computedRank));
  }
}

function getRequireBlock(node) {
  let n = node;
  // Handle cases like `const baz = require('foo').bar.baz`
  // and `const foo = require('foo')()`
  while (
    (n.parent.type === 'MemberExpression' && n.parent.object === n) ||
    (n.parent.type === 'CallExpression' && n.parent.callee === n)
  ) {
    n = n.parent;
  }
  if (
    n.parent.type === 'VariableDeclarator' &&
    n.parent.parent.type === 'VariableDeclaration' &&
    n.parent.parent.parent.type === 'Program'
  ) {
    return n.parent.parent.parent;
  }
}

const types = ['builtin', 'external', 'internal', 'unknown', 'parent', 'sibling', 'index', 'object', 'type'];

// Creates an object with type-rank pairs.
// Example: { index: 0, sibling: 1, parent: 1, external: 1, builtin: 2, internal: 2 }
// Will throw an error if it contains a type that does not exist, or has a duplicate
function convertGroupsToRanks(groups) {
  const ranks = groups.reduce(function (res, group, index) {
    let groupItems = group;
    if (typeof group === 'string') {
      groupItems = [group];
    }

    groupItems.forEach(function (groupItem) {
      if (types.indexOf(groupItem) === -1) {
        throw new Error('Incorrect configuration of the rule: Unknown type `' +
          JSON.stringify(groupItem) + '`');
      }
      if (res[groupItem] !== undefined) {
        throw new Error('Incorrect configuration of the rule: `' + groupItem + '` is duplicated');
      }
      res[groupItem] = index * 2;
    });
    return res;
  }, {});

  const omittedTypes = new Set(types.filter(function (type) {
    return ranks[type] === undefined;
  }));

  for (const omittedType of omittedTypes) {
    ranks[omittedType] = groups.length * 2;
  }

  return { ranks, omittedTypes };
}

function convertPathGroupsForRanks(pathGroups) {
  const after = {};
  const before = {};

  const transformed = pathGroups.map((pathGroup, index) => {
    const { group, position: positionString } = pathGroup;
    let position = 0;
    if (positionString === 'after') {
      if (!after[group]) {
        after[group] = 1;
      }
      position = after[group]++;
    } else if (positionString === 'before') {
      if (!before[group]) {
        before[group] = [];
      }
      before[group].push(index);
    }

    return Object.assign({}, pathGroup, { position });
  });

  let maxPosition = 1;

  Object.keys(before).forEach((group) => {
    const groupLength = before[group].length;
    before[group].forEach((groupIndex, index) => {
      transformed[groupIndex].position = -1 * (groupLength - index);
    });
    maxPosition = Math.max(maxPosition, groupLength);
  });

  Object.keys(after).forEach((key) => {
    const groupNextPosition = after[key];
    maxPosition = Math.max(maxPosition, groupNextPosition - 1);
  });

  return {
    pathGroups: transformed,
    maxPosition: maxPosition > 10 ? Math.pow(10, Math.ceil(Math.log10(maxPosition))) : 10,
  };
}

function fixNewLineAfterImport(context, previousImport) {
  const prevRoot = findRootNode(previousImport.node);
  const tokensToEndOfLine = takeTokensAfterWhile(
    context.getSourceCode(), prevRoot, commentOnSameLineAs(prevRoot));

  let endOfLine = prevRoot.range[1];
  if (tokensToEndOfLine.length > 0) {
    endOfLine = tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1];
  }
  return (fixer) => fixer.insertTextAfterRange([prevRoot.range[0], endOfLine], '\n');
}

function removeNewLineAfterImport(context, currentImport, previousImport) {
  const sourceCode = context.getSourceCode();
  const prevRoot = findRootNode(previousImport.node);
  const currRoot = findRootNode(currentImport.node);
  const rangeToRemove = [
    findEndOfLineWithComments(sourceCode, prevRoot),
    findStartOfLineWithComments(sourceCode, currRoot),
  ];
  if (/^\s*$/.test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    return (fixer) => fixer.removeRange(rangeToRemove);
  }
  return undefined;
}

function makeNewlinesBetweenReport(context, imported, newlinesBetweenImports, distinctGroup) {
  const getNumberOfEmptyLinesBetween = (currentImport, previousImport) => {
    const linesBetweenImports = context.getSourceCode().lines.slice(
      previousImport.node.loc.end.line,
      currentImport.node.loc.start.line - 1,
    );

    return linesBetweenImports.filter((line) => !line.trim().length).length;
  };
  const getIsStartOfDistinctGroup = (currentImport, previousImport) => {
    return currentImport.rank - 1 >= previousImport.rank;
  };
  let previousImport = imported[0];

  imported.slice(1).forEach(function (currentImport) {
    const emptyLinesBetween = getNumberOfEmptyLinesBetween(currentImport, previousImport);
    const isStartOfDistinctGroup = getIsStartOfDistinctGroup(currentImport, previousImport);

    if (newlinesBetweenImports === 'always'
        || newlinesBetweenImports === 'always-and-inside-groups') {
      if (currentImport.rank !== previousImport.rank && emptyLinesBetween === 0) {
        if (distinctGroup || (!distinctGroup && isStartOfDistinctGroup)) {
          context.report({
            node: previousImport.node,
            message: 'There should be at least one empty line between import groups',
            fix: fixNewLineAfterImport(context, previousImport),
          });
        }
      } else if (emptyLinesBetween > 0
        && newlinesBetweenImports !== 'always-and-inside-groups') {
        if ((distinctGroup && currentImport.rank === previousImport.rank) || (!distinctGroup && !isStartOfDistinctGroup)) {
          context.report({
            node: previousImport.node,
            message: 'There should be no empty line within import group',
            fix: removeNewLineAfterImport(context, currentImport, previousImport),
          });
        }
      }
    } else if (emptyLinesBetween > 0) {
      context.report({
        node: previousImport.node,
        message: 'There should be no empty line between import groups',
        fix: removeNewLineAfterImport(context, currentImport, previousImport),
      });
    }

    previousImport = currentImport;
  });
}

function getAlphabetizeConfig(options) {
  const alphabetize = options.alphabetize || {};
  const order = alphabetize.order || 'ignore';
  const orderImportKind = alphabetize.orderImportKind || 'ignore';
  const caseInsensitive = alphabetize.caseInsensitive || false;

  return { order, orderImportKind, caseInsensitive };
}

// TODO, semver-major: Change the default of "distinctGroup" from true to false
const defaultDistinctGroup = true;

// TODO, semver-major: Remove the "intraGroupOrdering" option and make it's truthy case the default implementation of this rule
const defaultIntraGroupOrdering = false;

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Enforce a convention in module import order.',
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
          intraGroupOrdering: {
            type: 'boolean',
            default: defaultIntraGroupOrdering,
          },
          pathGroupsExcludedImportTypes: {
            type: 'array',
          },
          distinctGroup: {
            type: 'boolean',
            default: defaultDistinctGroup,
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
              additionalProperties: false,
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
              orderImportKind: {
                enum: ['ignore', 'asc', 'desc'],
                default: 'ignore',
              },
            },
            additionalProperties: false,
          },
          warnOnUnassignedImports: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function importOrderRule(context) {
    const options = context.options[0] || {};
    const groups = options.groups || defaultGroups;
    const newlinesBetweenImports = options['newlines-between'] || 'ignore';
    const pathGroupsExcludedImportTypes = new Set(options['pathGroupsExcludedImportTypes'] || ['builtin', 'external', 'object']);
    const alphabetize = getAlphabetizeConfig(options);
    const distinctGroup = options.distinctGroup == null ? defaultDistinctGroup : !!options.distinctGroup;
    const intraGroupOrdering =  options.intraGroupOrdering == null ? defaultIntraGroupOrdering : !!options.intraGroupOrdering;
    
    let computedContext;
    try {
      const { pathGroups, maxPosition } = convertPathGroupsForRanks(options.pathGroups || []);
      const { ranks, omittedTypes } = convertGroupsToRanks(groups);
      
      computedContext = {
        ranks,
        omittedTypes,
        pathGroups,
        maxPosition,
      };
    } catch (error) {
      // Malformed configuration
      return {
        Program(node) {
          context.report(node, error.message);
        },
      };
    }
    const importMap = new Map();

    function getBlockImports(node) {
      if (!importMap.has(node)) {
        importMap.set(node, []);
      }
      return importMap.get(node);
    }

    return {
      ImportDeclaration: function handleImports(node) {
        // Ignoring unassigned imports unless warnOnUnassignedImports is set
        if (node.specifiers.length || options.warnOnUnassignedImports) {
          const name = node.source.value;
          registerNode(
            context,
            {
              node,
              value: name,
              displayName: name,
              type: 'import',
            },
            computedContext,
            getBlockImports(node.parent),
            pathGroupsExcludedImportTypes,
          );
        }
      },
      TSImportEqualsDeclaration: function handleImports(node) {
        let displayName;
        let value;
        let type;
        // skip "export import"s
        if (node.isExport) {
          return;
        }
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          value = node.moduleReference.expression.value;
          displayName = value;
          type = 'import';
        } else {
          value = '';
          displayName = context.getSourceCode().getText(node.moduleReference);
          type = 'import:object';
        }
        registerNode(
          context,
          {
            node,
            value,
            displayName,
            type,
          },
          computedContext,
          getBlockImports(node.parent),
          pathGroupsExcludedImportTypes,
        );
      },
      CallExpression: function handleRequires(node) {
        if (!isStaticRequire(node)) {
          return;
        }
        const block = getRequireBlock(node);
        if (!block) {
          return;
        }
        const name = node.arguments[0].value;
        registerNode(
          context,
          {
            node,
            value: name,
            displayName: name,
            type: 'require',
          },
          computedContext,
          getBlockImports(block),
          pathGroupsExcludedImportTypes,
        );
      },
      'Program:exit': function reportAndReset() {
        importMap.forEach((imported) => {
          if (newlinesBetweenImports !== 'ignore') {
            makeNewlinesBetweenReport(context, imported, newlinesBetweenImports, distinctGroup);
          }

          if (intraGroupOrdering || alphabetize.order !== 'ignore') {
            mutateRanksForIntraGroupOrdering(computedContext, imported, groups, intraGroupOrdering, alphabetize);
          }

          makeOutOfOrderReport(context, imported);
        });

        importMap.clear();
      },
    };
  },
};
