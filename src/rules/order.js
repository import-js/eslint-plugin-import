'use strict';

import minimatch from 'minimatch';
import includes from 'array-includes';
import groupBy from 'object.groupby';
import { getScope, getSourceCode } from 'eslint-module-utils/contextCompat';
import trimEnd from 'string.prototype.trimend';

import importType from '../core/importType';
import isStaticRequire from '../core/staticRequire';
import docsUrl from '../docsUrl';

const categories = {
  named: 'named',
  import: 'import',
  exports: 'exports',
};

const defaultGroups = ['builtin', 'external', 'parent', 'sibling', 'index'];

// REPORTING AND FIXING

function reverse(array) {
  return array.map((v) => ({ ...v, rank: -v.rank })).reverse();
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

function commentOnSameLineAs(node) {
  return (token) => (token.type === 'Block' ||  token.type === 'Line')
      && token.loc.start.line === token.loc.end.line
      && token.loc.end.line === node.loc.end.line;
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

function findSpecifierStart(sourceCode, node) {
  let token;

  do {
    token = sourceCode.getTokenBefore(node);
  } while (token.value !== ',' && token.value !== '{');

  return token.range[1];
}

function findSpecifierEnd(sourceCode, node) {
  let token;

  do {
    token = sourceCode.getTokenAfter(node);
  } while (token.value !== ',' && token.value !== '}');

  return token.range[0];
}

function isRequireExpression(expr) {
  return expr != null
    && expr.type === 'CallExpression'
    && expr.callee != null
    && expr.callee.name === 'require'
    && expr.arguments != null
    && expr.arguments.length === 1
    && expr.arguments[0].type === 'Literal';
}

function isSupportedRequireModule(node) {
  if (node.type !== 'VariableDeclaration') {
    return false;
  }
  if (node.declarations.length !== 1) {
    return false;
  }
  const decl = node.declarations[0];
  const isPlainRequire = decl.id
    && (decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern')
    && isRequireExpression(decl.init);
  const isRequireWithMemberExpression = decl.id
    && (decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern')
    && decl.init != null
    && decl.init.type === 'CallExpression'
    && decl.init.callee != null
    && decl.init.callee.type === 'MemberExpression'
    && isRequireExpression(decl.init.callee.object);
  return isPlainRequire || isRequireWithMemberExpression;
}

function isPlainImportModule(node) {
  return node.type === 'ImportDeclaration' && node.specifiers != null && node.specifiers.length > 0;
}

function isPlainImportEquals(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference.expression;
}

function isCJSExports(context, node) {
  if (
    node.type === 'MemberExpression'
    && node.object.type === 'Identifier'
    && node.property.type === 'Identifier'
    && node.object.name === 'module'
    && node.property.name === 'exports'
  ) {
    return getScope(context, node).variables.findIndex((variable) => variable.name === 'module') === -1;
  }
  if (
    node.type === 'Identifier'
    && node.name === 'exports'
  ) {
    return getScope(context, node).variables.findIndex((variable) => variable.name === 'exports') === -1;
  }
}

function getNamedCJSExports(context, node) {
  if (node.type !== 'MemberExpression') {
    return;
  }
  const result = [];
  let root = node;
  let parent = null;
  while (root.type === 'MemberExpression') {
    if (root.property.type !== 'Identifier') {
      return;
    }
    result.unshift(root.property.name);
    parent = root;
    root = root.object;
  }

  if (isCJSExports(context, root)) {
    return result;
  }

  if (isCJSExports(context, parent)) {
    return result.slice(1);
  }
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
  if (node.type === 'export') {
    if (node.node.exportKind === 'type') {
      return 'type export';
    }
    return 'export';
  }
  if (node.node.importKind === 'type') {
    return 'type import';
  }
  if (node.node.importKind === 'typeof') {
    return 'typeof import';
  }
  return 'import';
}

function fixOutOfOrder(context, firstNode, secondNode, order, category) {
  const isNamed = category === categories.named;
  const isExports = category === categories.exports;
  const sourceCode = getSourceCode(context);

  const {
    firstRoot,
    secondRoot,
  } = isNamed ? {
    firstRoot: firstNode.node,
    secondRoot: secondNode.node,
  } : {
    firstRoot: findRootNode(firstNode.node),
    secondRoot: findRootNode(secondNode.node),
  };

  const {
    firstRootStart,
    firstRootEnd,
    secondRootStart,
    secondRootEnd,
  } = isNamed ? {
    firstRootStart: findSpecifierStart(sourceCode, firstRoot),
    firstRootEnd: findSpecifierEnd(sourceCode, firstRoot),
    secondRootStart: findSpecifierStart(sourceCode, secondRoot),
    secondRootEnd: findSpecifierEnd(sourceCode, secondRoot),
  } : {
    firstRootStart: findStartOfLineWithComments(sourceCode, firstRoot),
    firstRootEnd: findEndOfLineWithComments(sourceCode, firstRoot),
    secondRootStart: findStartOfLineWithComments(sourceCode, secondRoot),
    secondRootEnd: findEndOfLineWithComments(sourceCode, secondRoot),
  };

  if (firstNode.displayName === secondNode.displayName) {
    if (firstNode.alias) {
      firstNode.displayName = `${firstNode.displayName} as ${firstNode.alias}`;
    }
    if (secondNode.alias) {
      secondNode.displayName = `${secondNode.displayName} as ${secondNode.alias}`;
    }
  }

  const firstImport = `${makeImportDescription(firstNode)} of \`${firstNode.displayName}\``;
  const secondImport = `\`${secondNode.displayName}\` ${makeImportDescription(secondNode)}`;
  const message = `${secondImport} should occur ${order} ${firstImport}`;

  if (isNamed) {
    const firstCode = sourceCode.text.slice(firstRootStart, firstRoot.range[1]);
    const firstTrivia = sourceCode.text.slice(firstRoot.range[1], firstRootEnd);
    const secondCode = sourceCode.text.slice(secondRootStart, secondRoot.range[1]);
    const secondTrivia = sourceCode.text.slice(secondRoot.range[1], secondRootEnd);

    if (order === 'before') {
      const trimmedTrivia = trimEnd(secondTrivia);
      const gapCode = sourceCode.text.slice(firstRootEnd, secondRootStart - 1);
      const whitespaces = secondTrivia.slice(trimmedTrivia.length);
      context.report({
        node: secondNode.node,
        message,
        fix: (fixer) => fixer.replaceTextRange(
          [firstRootStart, secondRootEnd],
          `${secondCode},${trimmedTrivia}${firstCode}${firstTrivia}${gapCode}${whitespaces}`,
        ),
      });
    } else if (order === 'after') {
      const trimmedTrivia = trimEnd(firstTrivia);
      const gapCode = sourceCode.text.slice(secondRootEnd + 1, firstRootStart);
      const whitespaces = firstTrivia.slice(trimmedTrivia.length);
      context.report({
        node: secondNode.node,
        message,
        fix: (fixes) => fixes.replaceTextRange(
          [secondRootStart, firstRootEnd],
          `${gapCode}${firstCode},${trimmedTrivia}${secondCode}${whitespaces}`,
        ),
      });
    }
  } else {
    const canFix = isExports || canReorderItems(firstRoot, secondRoot);
    let newCode = sourceCode.text.substring(secondRootStart, secondRootEnd);

    if (newCode[newCode.length - 1] !== '\n') {
      newCode = `${newCode}\n`;
    }

    if (order === 'before') {
      context.report({
        node: secondNode.node,
        message,
        fix: canFix && ((fixer) => fixer.replaceTextRange(
          [firstRootStart, secondRootEnd],
          newCode + sourceCode.text.substring(firstRootStart, secondRootStart),
        )),
      });
    } else if (order === 'after') {
      context.report({
        node: secondNode.node,
        message,
        fix: canFix && ((fixer) => fixer.replaceTextRange(
          [secondRootStart, firstRootEnd],
          sourceCode.text.substring(secondRootEnd, firstRootEnd) + newCode,
        )),
      });
    }
  }
}

function reportOutOfOrder(context, imported, outOfOrder, order, category) {
  outOfOrder.forEach(function (imp) {
    const found = imported.find(function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank;
    });
    fixOutOfOrder(context, found, imp, order, category);
  });
}

function makeOutOfOrderReport(context, imported, category) {
  const outOfOrder = findOutOfOrder(imported);
  if (!outOfOrder.length) {
    return;
  }

  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported);
  const reversedOrder = findOutOfOrder(reversedImported);
  if (reversedOrder.length < outOfOrder.length) {
    reportOutOfOrder(context, reversedImported, reversedOrder, 'after', category);
    return;
  }
  reportOutOfOrder(context, imported, outOfOrder, 'before', category);
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
  const multiplierImportKind = orderImportKind !== 'ignore'
    && (alphabetizeOptions.orderImportKind === 'asc' ? 1 : -1);

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
        // Skip comparing the first path segment, if they are relative segments for both imports
        if (i === 0 && ((A[i] === '.' || A[i] === '..') && (B[i] === '.' || B[i] === '..'))) {
          // If one is sibling and the other parent import, no need to compare at all, since the paths belong in different groups
          if (A[i] !== B[i]) { break; }
          continue;
        }
        result = compareString(A[i], B[i]);
        if (result) { break; }
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

function mutateRanksToAlphabetize(imported, alphabetizeOptions) {
  const groupedByRanks = groupBy(imported, (item) => item.rank);

  const sorterFn = getSorter(alphabetizeOptions);

  // sort group keys so that they can be iterated on in order
  const groupRanks = Object.keys(groupedByRanks).sort(function (a, b) {
    return a - b;
  });

  // sort imports locally within their group
  groupRanks.forEach(function (groupRank) {
    groupedByRanks[groupRank].sort(sorterFn);
  });

  // assign globally unique rank to each import
  let newRank = 0;
  const alphabetizedRanks = groupRanks.reduce(function (acc, groupRank) {
    groupedByRanks[groupRank].forEach(function (importedItem) {
      acc[`${importedItem.value}|${importedItem.node.importKind}`] = parseInt(groupRank, 10) + newRank;
      newRank += 1;
    });
    return acc;
  }, {});

  // mutate the original group-rank with alphabetized-rank
  imported.forEach(function (importedItem) {
    importedItem.rank = alphabetizedRanks[`${importedItem.value}|${importedItem.node.importKind}`];
  });
}

// DETECTING

function computePathRank(ranks, pathGroups, path, maxPosition) {
  for (let i = 0, l = pathGroups.length; i < l; i++) {
    const { pattern, patternOptions, group, position = 1 } = pathGroups[i];
    if (minimatch(path, pattern, patternOptions || { nocomment: true })) {
      return ranks[group] + position / maxPosition;
    }
  }
}

function computeRank(context, ranks, importEntry, excludedImportTypes) {
  let impType;
  let rank;
  if (importEntry.type === 'import:object') {
    impType = 'object';
  } else if (importEntry.node.importKind === 'type' && ranks.omittedTypes.indexOf('type') === -1) {
    impType = 'type';
  } else {
    impType = importType(importEntry.value, context);
  }
  if (!excludedImportTypes.has(impType)) {
    rank = computePathRank(ranks.groups, ranks.pathGroups, importEntry.value, ranks.maxPosition);
  }
  if (typeof rank === 'undefined') {
    rank = ranks.groups[impType];
  }
  if (importEntry.type !== 'import' && !importEntry.type.startsWith('import:')) {
    rank += 100;
  }

  return rank;
}

function registerNode(context, importEntry, ranks, imported, excludedImportTypes) {
  const rank = computeRank(context, ranks, importEntry, excludedImportTypes);
  if (rank !== -1) {
    imported.push({ ...importEntry, rank });
  }
}

function getRequireBlock(node) {
  let n = node;
  // Handle cases like `const baz = require('foo').bar.baz`
  // and `const foo = require('foo')()`
  while (
    n.parent.type === 'MemberExpression' && n.parent.object === n
    || n.parent.type === 'CallExpression' && n.parent.callee === n
  ) {
    n = n.parent;
  }
  if (
    n.parent.type === 'VariableDeclarator'
    && n.parent.parent.type === 'VariableDeclaration'
    && n.parent.parent.parent.type === 'Program'
  ) {
    return n.parent.parent.parent;
  }
}

const types = ['builtin', 'external', 'internal', 'unknown', 'parent', 'sibling', 'index', 'object', 'type'];

// Creates an object with type-rank pairs.
// Example: { index: 0, sibling: 1, parent: 1, external: 1, builtin: 2, internal: 2 }
// Will throw an error if it contains a type that does not exist, or has a duplicate
function convertGroupsToRanks(groups) {
  const rankObject = groups.reduce(function (res, group, index) {
    [].concat(group).forEach(function (groupItem) {
      if (types.indexOf(groupItem) === -1) {
        throw new Error(`Incorrect configuration of the rule: Unknown type \`${JSON.stringify(groupItem)}\``);
      }
      if (res[groupItem] !== undefined) {
        throw new Error(`Incorrect configuration of the rule: \`${groupItem}\` is duplicated`);
      }
      res[groupItem] = index * 2;
    });
    return res;
  }, {});

  const omittedTypes = types.filter(function (type) {
    return typeof rankObject[type] === 'undefined';
  });

  const ranks = omittedTypes.reduce(function (res, type) {
    res[type] = groups.length * 2;
    return res;
  }, rankObject);

  return { groups: ranks, omittedTypes };
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

    return { ...pathGroup, position };
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
    getSourceCode(context),
    prevRoot,
    commentOnSameLineAs(prevRoot),
  );

  let endOfLine = prevRoot.range[1];
  if (tokensToEndOfLine.length > 0) {
    endOfLine = tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1];
  }
  return (fixer) => fixer.insertTextAfterRange([prevRoot.range[0], endOfLine], '\n');
}

function removeNewLineAfterImport(context, currentImport, previousImport) {
  const sourceCode = getSourceCode(context);
  const prevRoot = findRootNode(previousImport.node);
  const currRoot = findRootNode(currentImport.node);
  const rangeToRemove = [
    findEndOfLineWithComments(sourceCode, prevRoot),
    findStartOfLineWithComments(sourceCode, currRoot),
  ];
  if ((/^\s*$/).test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    return (fixer) => fixer.removeRange(rangeToRemove);
  }
  return undefined;
}

function makeNewlinesBetweenReport(context, imported, newlinesBetweenImports, distinctGroup) {
  const getNumberOfEmptyLinesBetween = (currentImport, previousImport) => {
    const linesBetweenImports = getSourceCode(context).lines.slice(
      previousImport.node.loc.end.line,
      currentImport.node.loc.start.line - 1,
    );

    return linesBetweenImports.filter((line) => !line.trim().length).length;
  };
  const getIsStartOfDistinctGroup = (currentImport, previousImport) => currentImport.rank - 1 >= previousImport.rank;
  let previousImport = imported[0];

  imported.slice(1).forEach(function (currentImport) {
    const emptyLinesBetween = getNumberOfEmptyLinesBetween(currentImport, previousImport);
    const isStartOfDistinctGroup = getIsStartOfDistinctGroup(currentImport, previousImport);

    if (newlinesBetweenImports === 'always'
        || newlinesBetweenImports === 'always-and-inside-groups') {
      if (currentImport.rank !== previousImport.rank && emptyLinesBetween === 0) {
        if (distinctGroup || !distinctGroup && isStartOfDistinctGroup) {
          context.report({
            node: previousImport.node,
            message: 'There should be at least one empty line between import groups',
            fix: fixNewLineAfterImport(context, previousImport),
          });
        }
      } else if (emptyLinesBetween > 0
        && newlinesBetweenImports !== 'always-and-inside-groups') {
        if (distinctGroup && currentImport.rank === previousImport.rank || !distinctGroup && !isStartOfDistinctGroup) {
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
          named: {
            default: false,
            oneOf: [{
              type: 'boolean',
            }, {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                import: { type: 'boolean' },
                export: { type: 'boolean' },
                require: { type: 'boolean' },
                cjsExports: { type: 'boolean' },
                types: {
                  type: 'string',
                  enum: [
                    'mixed',
                    'types-first',
                    'types-last',
                  ],
                },
              },
              additionalProperties: false,
            }],
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

  create(context) {
    const options = context.options[0] || {};
    const newlinesBetweenImports = options['newlines-between'] || 'ignore';
    const pathGroupsExcludedImportTypes = new Set(options.pathGroupsExcludedImportTypes || ['builtin', 'external', 'object']);

    const named = {
      types: 'mixed',
      ...typeof options.named === 'object' ? {
        ...options.named,
        import: 'import' in options.named ? options.named.import : options.named.enabled,
        export: 'export' in options.named ? options.named.export : options.named.enabled,
        require: 'require' in options.named ? options.named.require : options.named.enabled,
        cjsExports: 'cjsExports' in options.named ? options.named.cjsExports : options.named.enabled,
      } : {
        import: options.named,
        export: options.named,
        require: options.named,
        cjsExports: options.named,
      },
    };

    const namedGroups = named.types === 'mixed' ? [] : named.types === 'types-last' ? ['value'] : ['type'];
    const alphabetize = getAlphabetizeConfig(options);
    const distinctGroup = options.distinctGroup == null ? defaultDistinctGroup : !!options.distinctGroup;
    let ranks;

    try {
      const { pathGroups, maxPosition } = convertPathGroupsForRanks(options.pathGroups || []);
      const { groups, omittedTypes } = convertGroupsToRanks(options.groups || defaultGroups);
      ranks = {
        groups,
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
    const exportMap = new Map();

    function getBlockImports(node) {
      if (!importMap.has(node)) {
        importMap.set(node, []);
      }
      return importMap.get(node);
    }

    function getBlockExports(node) {
      if (!exportMap.has(node)) {
        exportMap.set(node, []);
      }
      return exportMap.get(node);
    }

    function makeNamedOrderReport(context, namedImports) {
      if (namedImports.length > 1) {
        const imports = namedImports.map(
          (namedImport) => {
            const kind = namedImport.kind || 'value';
            const rank = namedGroups.findIndex((entry) => [].concat(entry).indexOf(kind) > -1);

            return {
              displayName: namedImport.value,
              rank: rank === -1 ? namedGroups.length : rank,
              ...namedImport,
              value: `${namedImport.value}:${namedImport.alias || ''}`,
            };
          });

        if (alphabetize.order !== 'ignore') {
          mutateRanksToAlphabetize(imports, alphabetize);
        }

        makeOutOfOrderReport(context, imports, categories.named);
      }
    }

    return {
      ImportDeclaration(node) {
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
            ranks,
            getBlockImports(node.parent),
            pathGroupsExcludedImportTypes,
          );

          if (named.import) {
            makeNamedOrderReport(
              context,
              node.specifiers.filter(
                (specifier) => specifier.type === 'ImportSpecifier').map(
                (specifier) => ({
                  node: specifier,
                  value: specifier.imported.name,
                  type: 'import',
                  kind: specifier.importKind,
                  ...specifier.local.range[0] !== specifier.imported.range[0] && {
                    alias: specifier.local.name,
                  },
                }),
              ),
            );
          }
        }
      },
      TSImportEqualsDeclaration(node) {
        // skip "export import"s
        if (node.isExport) {
          return;
        }

        let displayName;
        let value;
        let type;
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          value = node.moduleReference.expression.value;
          displayName = value;
          type = 'import';
        } else {
          value = '';
          displayName = getSourceCode(context).getText(node.moduleReference);
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
          ranks,
          getBlockImports(node.parent),
          pathGroupsExcludedImportTypes,
        );
      },
      CallExpression(node) {
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
          ranks,
          getBlockImports(block),
          pathGroupsExcludedImportTypes,
        );
      },
      ...named.require && {
        VariableDeclarator(node) {
          if (node.id.type === 'ObjectPattern' && isRequireExpression(node.init)) {
            for (let i = 0; i < node.id.properties.length; i++) {
              if (
                node.id.properties[i].key.type !== 'Identifier'
                || node.id.properties[i].value.type !== 'Identifier'
              ) {
                return;
              }
            }
            makeNamedOrderReport(
              context,
              node.id.properties.map((prop) => ({
                node: prop,
                value: prop.key.name,
                type: 'require',
                ...prop.key.range[0] !== prop.value.range[0] && {
                  alias: prop.value.name,
                },
              })),
            );
          }
        },
      },
      ...named.export && {
        ExportNamedDeclaration(node) {
          makeNamedOrderReport(
            context,
            node.specifiers.map((specifier) => ({
              node: specifier,
              value: specifier.local.name,
              type: 'export',
              kind: specifier.exportKind,
              ...specifier.local.range[0] !== specifier.exported.range[0] && {
                alias: specifier.exported.name,
              },
            })),
          );
        },
      },
      ...named.cjsExports && {
        AssignmentExpression(node) {
          if (node.parent.type === 'ExpressionStatement') {
            if (isCJSExports(context, node.left)) {
              if (node.right.type === 'ObjectExpression') {
                for (let i = 0; i < node.right.properties.length; i++) {
                  if (
                    node.right.properties[i].key.type !== 'Identifier'
                    || node.right.properties[i].value.type !== 'Identifier'
                  ) {
                    return;
                  }
                }

                makeNamedOrderReport(
                  context,
                  node.right.properties.map((prop) => ({
                    node: prop,
                    value: prop.key.name,
                    type: 'export',
                    ...prop.key.range[0] !== prop.value.range[0] && {
                      alias: prop.value.name,
                    },
                  })),
                );
              }
            } else {
              const nameParts = getNamedCJSExports(context, node.left);
              if (nameParts && nameParts.length > 0) {
                const name = nameParts.join('.');
                getBlockExports(node.parent.parent).push({
                  node,
                  value: name,
                  displayName: name,
                  type: 'export',
                  rank: 0,
                });
              }
            }
          }
        },
      },
      'Program:exit'() {
        importMap.forEach((imported) => {
          if (newlinesBetweenImports !== 'ignore') {
            makeNewlinesBetweenReport(context, imported, newlinesBetweenImports, distinctGroup);
          }

          if (alphabetize.order !== 'ignore') {
            mutateRanksToAlphabetize(imported, alphabetize);
          }

          makeOutOfOrderReport(context, imported, categories.import);
        });

        exportMap.forEach((exported) => {
          if (alphabetize.order !== 'ignore') {
            mutateRanksToAlphabetize(exported, alphabetize);
            makeOutOfOrderReport(context, exported, categories.exports);
          }
        });

        importMap.clear();
        exportMap.clear();
      },
    };
  },
};
