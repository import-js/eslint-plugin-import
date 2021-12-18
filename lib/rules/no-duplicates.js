'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);
var _array = require('../core/utils/array');function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}}function _toArray(arr) {return Array.isArray(arr) ? arr : Array.from(arr);}

/**
                                                                                                                                                                                                                                                                                                                                                                                                                  * returns either `import` or `type` token, as in
                                                                                                                                                                                                                                                                                                                                                                                                                  *
                                                                                                                                                                                                                                                                                                                                                                                                                  * import { useState } from 'react'
                                                                                                                                                                                                                                                                                                                                                                                                                  * or
                                                                                                                                                                                                                                                                                                                                                                                                                  * import type { FC } from 'react'
                                                                                                                                                                                                                                                                                                                                                                                                                  */
function getFirstStaticToken(tokens) {
  var firstToken = tokens[0];
  var secondToken = tokens[1];

  if (secondToken && secondToken.value === 'type') {
    return secondToken;
  }

  return firstToken;
}

/**
   * return the import path token, e.g. 'react' as in
   *
   * import { useState } from 'react'
   * or
   * import { useState } from 'react';
   */
function getLastStaticToken(tokens) {
  var lastToken = tokens[tokens.length - 1];

  if (isPunctuator(lastToken, ';')) {
    return tokens[tokens.length - 2];
  }

  return lastToken;
}

/**
   * Merges specifiers together to one statement and sorts them alphabetically
   *
   * @returns e.g. `{ useState, useEffect, FC }`
   */
function getNamedSpecifiersText(specifiers) {
  var specifierInfos = specifiers.
  filter(function (info) {return info && !info.isEmpty;});

  var setOfSpecifiers = new Set(
  (0, _array.arrayFlat)(
  specifierInfos.
  map(function (info) {return info.text;}).
  map(function (text) {return text.split(',');})).

  map(function (specifier) {return specifier.trim();}).
  filter(Boolean));


  var specifiersText = Array.from(setOfSpecifiers.values()).
  sort().
  join(', ');


  if (specifiersText.length > 0) {
    specifiersText = '{ ' + String(specifiersText) + ' }';
  }

  return specifiersText;
}

/**
   * Generates fix commands to create a new import statement including
   * all import specifiers if any, plus the default import specifier if any.
   *
   * This is extra useful for users that want to resolve a merge conflict
   * of imports. Now they can use `Accept both` and let this rule merge all
   * these imports for them thanks to auto-fix.
   *
   * Does not support mixing specifiers and comments
   *
   * e.g. import {
   *    useState, // I like this hook
   *    useEffect,
   * } from 'react'
   *
   * Lines like this will not get an auto-fix
   */
function generateFixCommandsToMergeImportsIntoTheFirstOne(args) {var

  specifiers =




  args.specifiers,defaultImportName = args.defaultImportName,fixer = args.fixer,firstStaticToken = args.firstStaticToken,lastStaticToken = args.lastStaticToken;

  /**
                                                                                                                                                                  * e.g. `React, { useState }`
                                                                                                                                                                  */
  var specifiersText = [defaultImportName, getNamedSpecifiersText(specifiers)].
  filter(function (item) {return item && item.length > 0;}).
  join(', ');

  if (specifiersText.length === 0) {
    // no fixes
    return [];
  }

  /**
     * e.g. ` React, { useState } from `
     */
  var fixText = ' ' + String(specifiersText) + ' from ';

  /**
                                                          * This is the range of the specifiers text of the first import line
                                                          * e.g. if the first import line is
                                                          *
                                                          * import { xxx } from 'hello'
                                                          *
                                                          * Then this range is the range of this text: ` { xxx } `
                                                          */
  var specifiersTextRangeOfFirstImportStatement = [
  firstStaticToken.range[1],
  lastStaticToken.range[0]];


  return [
  fixer.removeRange(specifiersTextRangeOfFirstImportStatement),
  fixer.insertTextAfter(firstStaticToken, fixText)];

}

function checkImports(imported, context) {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
    for (var _iterator = imported.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var _ref = _step.value;var _ref2 = _slicedToArray(_ref, 2);var _module = _ref2[0];var nodes = _ref2[1];
      if (nodes.length > 1) {
        var message = '\'' + String(_module) + '\' imported multiple times.';var _nodes = _toArray(
        nodes),first = _nodes[0],rest = _nodes.slice(1);
        var sourceCode = context.getSourceCode();
        var fix = getFix(first, rest, sourceCode);

        context.report({
          node: first.source,
          message: message,
          fix: fix // Attach the autofix (if any) to the first import.
        });var _iteratorNormalCompletion2 = true;var _didIteratorError2 = false;var _iteratorError2 = undefined;try {

          for (var _iterator2 = rest[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {var node = _step2.value;
            context.report({
              node: node.source,
              message: message });

          }} catch (err) {_didIteratorError2 = true;_iteratorError2 = err;} finally {try {if (!_iteratorNormalCompletion2 && _iterator2['return']) {_iterator2['return']();}} finally {if (_didIteratorError2) {throw _iteratorError2;}}}
      }
    }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator['return']) {_iterator['return']();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
}

function hasInlineComment(info) {
  return info ? info.text.includes('/') : false;
}

function getFix(first, rest, sourceCode) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined;
  }

  // Adjusting the first import might make it multiline, which could break
  // `eslint-disable-next-line` comments and similar, so bail if the first
  // import has comments. Also, if the first import is `import * as ns from
  // './foo'` there's nothing we can do.
  if (hasProblematicComments(first, sourceCode) || hasNamespace(first)) {
    return undefined;
  }

  var defaultImportNames = new Set(
  [first].concat(_toConsumableArray(rest)).map(getDefaultImportName).filter(Boolean));


  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined;
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  var restWithoutComments = rest.filter(function (node) {return !(
    hasProblematicComments(node, sourceCode) ||
    hasNamespace(node));});


  function getSpecifierInfo(node) {
    var tokens = sourceCode.getTokens(node);
    var openBrace = tokens.find(function (token) {return isPunctuator(token, '{');});
    var closeBrace = tokens.find(function (token) {return isPunctuator(token, '}');});

    if (openBrace == null || closeBrace == null) {
      return undefined;
    }

    return {
      importNode: node,
      text: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]),
      hasTrailingComma: isPunctuator(sourceCode.getTokenBefore(closeBrace), ','),
      isEmpty: !hasSpecifiers(node) };

  }

  var specifiers = restWithoutComments.
  map(getSpecifierInfo).
  filter(Boolean);

  var unnecessaryImports = restWithoutComments.filter(function (node) {return (
      !hasSpecifiers(node) &&
      !hasNamespace(node) &&
      !specifiers.some(function (specifier) {return specifier.importNode === node;}));});


  var shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  var shouldAddSpecifiers = specifiers.length > 0;
  var shouldRemoveUnnecessary = unnecessaryImports.length > 0;

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  return function (fixer) {
    var tokens = sourceCode.getTokens(first);
    var firstStaticToken = getFirstStaticToken(tokens);
    var lastStaticToken = getLastStaticToken(tokens);var _defaultImportNames = _slicedToArray(

    defaultImportNames, 1),defaultImportName = _defaultImportNames[0];
    var firstSpecifier = getSpecifierInfo(first);

    if (hasInlineComment(firstSpecifier)) {
      return [];
    }

    var specifiersWithoutInlineComments = specifiers.
    filter(function (info) {return !hasInlineComment(info);});

    var fixes = [];

    if (shouldAddDefault || shouldAddSpecifiers) {
      generateFixCommandsToMergeImportsIntoTheFirstOne({
        specifiers: [].concat(_toConsumableArray(specifiersWithoutInlineComments), [firstSpecifier]),
        defaultImportName: defaultImportName,
        fixer: fixer,
        firstStaticToken: firstStaticToken,
        lastStaticToken: lastStaticToken }).
      forEach(function (fix) {return fixes.push(fix);});
    }

    // Remove imports whose specifiers have been moved into the first import.
    var _iteratorNormalCompletion3 = true;var _didIteratorError3 = false;var _iteratorError3 = undefined;try {for (var _iterator3 = specifiersWithoutInlineComments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {var specifier = _step3.value;
        var importNode = specifier.importNode;
        fixes.push(fixer.remove(importNode));

        var charAfterImportRange = [importNode.range[1], importNode.range[1] + 1];
        var charAfterImport = sourceCode.text.substring(
        charAfterImportRange[0],
        charAfterImportRange[1]);


        if (charAfterImport === '\n') {
          fixes.push(fixer.removeRange(charAfterImportRange));
        }
      }

      // Remove imports whose default import has been moved to the first import,
      // and side-effect-only imports that are unnecessary due to the first
      // import.
    } catch (err) {_didIteratorError3 = true;_iteratorError3 = err;} finally {try {if (!_iteratorNormalCompletion3 && _iterator3['return']) {_iterator3['return']();}} finally {if (_didIteratorError3) {throw _iteratorError3;}}}var _iteratorNormalCompletion4 = true;var _didIteratorError4 = false;var _iteratorError4 = undefined;try {for (var _iterator4 = unnecessaryImports[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {var node = _step4.value;
        fixes.push(fixer.remove(node));

        var charAfterImportRange = [node.range[1], node.range[1] + 1];
        var charAfterImport = sourceCode.text.substring(
        charAfterImportRange[0],
        charAfterImportRange[1]);


        if (charAfterImport === '\n') {
          fixes.push(fixer.removeRange(charAfterImportRange));
        }
      }} catch (err) {_didIteratorError4 = true;_iteratorError4 = err;} finally {try {if (!_iteratorNormalCompletion4 && _iterator4['return']) {_iterator4['return']();}} finally {if (_didIteratorError4) {throw _iteratorError4;}}}

    return fixes;
  };
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value;
}

// Get the name of the default import of `node`, if any.
function getDefaultImportName(node) {
  var defaultSpecifier = node.specifiers.
  find(function (specifier) {return specifier.type === 'ImportDefaultSpecifier';});
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined;
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  var specifiers = node.specifiers.
  filter(function (specifier) {return specifier.type === 'ImportNamespaceSpecifier';});
  return specifiers.length > 0;
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  var specifiers = node.specifiers.
  filter(function (specifier) {return specifier.type === 'ImportSpecifier';});
  return specifiers.length > 0;
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentInsideNonSpecifiers(node, sourceCode));

}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node).
  some(function (comment) {return comment.loc.end.line >= node.loc.start.line - 1;});
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node).
  some(function (comment) {return comment.loc.start.line === node.loc.end.line;});
}

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  var tokens = sourceCode.getTokens(node);
  var openBraceIndex = tokens.findIndex(function (token) {return isPunctuator(token, '{');});
  var closeBraceIndex = tokens.findIndex(function (token) {return isPunctuator(token, '}');});
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  var someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0 ?
  tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1)) :
  tokens.slice(1);
  return someTokens.some(function (token) {return sourceCode.getCommentsBefore(token).length > 0;});
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2['default'])('no-duplicates') },

    fixable: 'code',
    schema: [
    {
      type: 'object',
      properties: {
        considerQueryString: {
          type: 'boolean' } },


      additionalProperties: false }] },




  create: function () {function create(context) {
      // Prepare the resolver from options.
      var considerQueryStringOption = context.options[0] &&
      context.options[0]['considerQueryString'];
      var defaultResolver = function () {function defaultResolver(sourcePath) {return (0, _resolve2['default'])(sourcePath, context) || sourcePath;}return defaultResolver;}();
      var resolver = considerQueryStringOption ? function (sourcePath) {
        var parts = sourcePath.match(/^([^?]*)\?(.*)$/);
        if (!parts) {
          return defaultResolver(sourcePath);
        }
        return defaultResolver(parts[1]) + '?' + parts[2];
      } : defaultResolver;

      var imported = new Map();
      var nsImported = new Map();
      var defaultTypesImported = new Map();
      var namedTypesImported = new Map();

      function getImportMap(n) {
        if (n.importKind === 'type') {
          return (
            n.specifiers.length > 0 &&
            n.specifiers[0].type === 'ImportDefaultSpecifier' ?
            defaultTypesImported : namedTypesImported);
        }

        return hasNamespace(n) ? nsImported : imported;
      }

      return {
        ImportDeclaration: function () {function ImportDeclaration(n) {
            // resolved path will cover aliased duplicates
            var resolvedPath = resolver(n.source.value);
            var importMap = getImportMap(n);

            if (importMap.has(resolvedPath)) {
              importMap.get(resolvedPath).push(n);
            } else {
              importMap.set(resolvedPath, [n]);
            }
          }return ImportDeclaration;}(),

        'Program:exit': function () {function ProgramExit() {
            checkImports(imported, context);
            checkImports(nsImported, context);
            checkImports(defaultTypesImported, context);
            checkImports(namedTypesImported, context);
          }return ProgramExit;}() };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kdXBsaWNhdGVzLmpzIl0sIm5hbWVzIjpbImdldEZpcnN0U3RhdGljVG9rZW4iLCJ0b2tlbnMiLCJmaXJzdFRva2VuIiwic2Vjb25kVG9rZW4iLCJ2YWx1ZSIsImdldExhc3RTdGF0aWNUb2tlbiIsImxhc3RUb2tlbiIsImxlbmd0aCIsImlzUHVuY3R1YXRvciIsImdldE5hbWVkU3BlY2lmaWVyc1RleHQiLCJzcGVjaWZpZXJzIiwic3BlY2lmaWVySW5mb3MiLCJmaWx0ZXIiLCJpbmZvIiwiaXNFbXB0eSIsInNldE9mU3BlY2lmaWVycyIsIlNldCIsIm1hcCIsInRleHQiLCJzcGxpdCIsInNwZWNpZmllciIsInRyaW0iLCJCb29sZWFuIiwic3BlY2lmaWVyc1RleHQiLCJBcnJheSIsImZyb20iLCJ2YWx1ZXMiLCJzb3J0Iiwiam9pbiIsImdlbmVyYXRlRml4Q29tbWFuZHNUb01lcmdlSW1wb3J0c0ludG9UaGVGaXJzdE9uZSIsImFyZ3MiLCJkZWZhdWx0SW1wb3J0TmFtZSIsImZpeGVyIiwiZmlyc3RTdGF0aWNUb2tlbiIsImxhc3RTdGF0aWNUb2tlbiIsIml0ZW0iLCJmaXhUZXh0Iiwic3BlY2lmaWVyc1RleHRSYW5nZU9mRmlyc3RJbXBvcnRTdGF0ZW1lbnQiLCJyYW5nZSIsInJlbW92ZVJhbmdlIiwiaW5zZXJ0VGV4dEFmdGVyIiwiY2hlY2tJbXBvcnRzIiwiaW1wb3J0ZWQiLCJjb250ZXh0IiwiZW50cmllcyIsIm1vZHVsZSIsIm5vZGVzIiwibWVzc2FnZSIsImZpcnN0IiwicmVzdCIsInNvdXJjZUNvZGUiLCJnZXRTb3VyY2VDb2RlIiwiZml4IiwiZ2V0Rml4IiwicmVwb3J0Iiwibm9kZSIsInNvdXJjZSIsImhhc0lubGluZUNvbW1lbnQiLCJpbmNsdWRlcyIsImdldENvbW1lbnRzQmVmb3JlIiwidW5kZWZpbmVkIiwiaGFzUHJvYmxlbWF0aWNDb21tZW50cyIsImhhc05hbWVzcGFjZSIsImRlZmF1bHRJbXBvcnROYW1lcyIsImdldERlZmF1bHRJbXBvcnROYW1lIiwic2l6ZSIsInJlc3RXaXRob3V0Q29tbWVudHMiLCJnZXRTcGVjaWZpZXJJbmZvIiwiZ2V0VG9rZW5zIiwib3BlbkJyYWNlIiwiZmluZCIsInRva2VuIiwiY2xvc2VCcmFjZSIsImltcG9ydE5vZGUiLCJzbGljZSIsImhhc1RyYWlsaW5nQ29tbWEiLCJnZXRUb2tlbkJlZm9yZSIsImhhc1NwZWNpZmllcnMiLCJ1bm5lY2Vzc2FyeUltcG9ydHMiLCJzb21lIiwic2hvdWxkQWRkRGVmYXVsdCIsInNob3VsZEFkZFNwZWNpZmllcnMiLCJzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSIsImZpcnN0U3BlY2lmaWVyIiwic3BlY2lmaWVyc1dpdGhvdXRJbmxpbmVDb21tZW50cyIsImZpeGVzIiwiZm9yRWFjaCIsInB1c2giLCJyZW1vdmUiLCJjaGFyQWZ0ZXJJbXBvcnRSYW5nZSIsImNoYXJBZnRlckltcG9ydCIsInN1YnN0cmluZyIsInR5cGUiLCJkZWZhdWx0U3BlY2lmaWVyIiwibG9jYWwiLCJuYW1lIiwiaGFzQ29tbWVudEJlZm9yZSIsImhhc0NvbW1lbnRBZnRlciIsImhhc0NvbW1lbnRJbnNpZGVOb25TcGVjaWZpZXJzIiwiY29tbWVudCIsImxvYyIsImVuZCIsImxpbmUiLCJzdGFydCIsImdldENvbW1lbnRzQWZ0ZXIiLCJvcGVuQnJhY2VJbmRleCIsImZpbmRJbmRleCIsImNsb3NlQnJhY2VJbmRleCIsInNvbWVUb2tlbnMiLCJjb25jYXQiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJmaXhhYmxlIiwic2NoZW1hIiwicHJvcGVydGllcyIsImNvbnNpZGVyUXVlcnlTdHJpbmciLCJhZGRpdGlvbmFsUHJvcGVydGllcyIsImNyZWF0ZSIsImNvbnNpZGVyUXVlcnlTdHJpbmdPcHRpb24iLCJvcHRpb25zIiwiZGVmYXVsdFJlc29sdmVyIiwic291cmNlUGF0aCIsInJlc29sdmVyIiwicGFydHMiLCJtYXRjaCIsIk1hcCIsIm5zSW1wb3J0ZWQiLCJkZWZhdWx0VHlwZXNJbXBvcnRlZCIsIm5hbWVkVHlwZXNJbXBvcnRlZCIsImdldEltcG9ydE1hcCIsIm4iLCJpbXBvcnRLaW5kIiwiSW1wb3J0RGVjbGFyYXRpb24iLCJyZXNvbHZlZFBhdGgiLCJpbXBvcnRNYXAiLCJoYXMiLCJnZXQiLCJzZXQiXSwibWFwcGluZ3MiOiJxb0JBQUEsc0Q7QUFDQSxxQztBQUNBLDRDOztBQUVBOzs7Ozs7O0FBT0EsU0FBU0EsbUJBQVQsQ0FBNkJDLE1BQTdCLEVBQXFDO0FBQ25DLE1BQU1DLGFBQWFELE9BQU8sQ0FBUCxDQUFuQjtBQUNBLE1BQU1FLGNBQWNGLE9BQU8sQ0FBUCxDQUFwQjs7QUFFQSxNQUFJRSxlQUFlQSxZQUFZQyxLQUFaLEtBQXNCLE1BQXpDLEVBQWlEO0FBQy9DLFdBQU9ELFdBQVA7QUFDRDs7QUFFRCxTQUFPRCxVQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUFPQSxTQUFTRyxrQkFBVCxDQUE0QkosTUFBNUIsRUFBb0M7QUFDbEMsTUFBTUssWUFBWUwsT0FBT0EsT0FBT00sTUFBUCxHQUFnQixDQUF2QixDQUFsQjs7QUFFQSxNQUFJQyxhQUFhRixTQUFiLEVBQXdCLEdBQXhCLENBQUosRUFBa0M7QUFDaEMsV0FBT0wsT0FBT0EsT0FBT00sTUFBUCxHQUFnQixDQUF2QixDQUFQO0FBQ0Q7O0FBRUQsU0FBT0QsU0FBUDtBQUNEOztBQUVEOzs7OztBQUtBLFNBQVNHLHNCQUFULENBQWdDQyxVQUFoQyxFQUE0QztBQUMxQyxNQUFNQyxpQkFBaUJEO0FBQ3BCRSxRQURvQixDQUNiLHdCQUFRQyxRQUFRLENBQUNBLEtBQUtDLE9BQXRCLEVBRGEsQ0FBdkI7O0FBR0EsTUFBTUMsa0JBQWtCLElBQUlDLEdBQUo7QUFDdEI7QUFDRUw7QUFDR00sS0FESCxDQUNPLHdCQUFRSixLQUFLSyxJQUFiLEVBRFA7QUFFR0QsS0FGSCxDQUVPLHdCQUFRQyxLQUFLQyxLQUFMLENBQVcsR0FBWCxDQUFSLEVBRlAsQ0FERjs7QUFLR0YsS0FMSCxDQUtPLDZCQUFhRyxVQUFV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QVVDLEdBQVYsQ0FBY0YsWUFBZCxDQUFKLEVBQWlDO0FBQy9CQyx3QkFBVUUsR0FBVixDQUFjSCxZQUFkLEVBQTRCaEQsSUFBNUIsQ0FBaUM2QyxDQUFqQztBQUNELGFBRkQsTUFFTztBQUNMSSx3QkFBVUcsR0FBVixDQUFjSixZQUFkLEVBQTRCLENBQUNILENBQUQsQ0FBNUI7QUFDRDtBQUNGLFdBWEk7O0FBYUwscUNBQWdCLHVCQUFZO0FBQzFCM0YseUJBQWFDLFFBQWIsRUFBdUJDLE9BQXZCO0FBQ0FGLHlCQUFhdUYsVUFBYixFQUF5QnJGLE9BQXpCO0FBQ0FGLHlCQUFhd0Ysb0JBQWIsRUFBbUN0RixPQUFuQztBQUNBRix5QkFBYXlGLGtCQUFiLEVBQWlDdkYsT0FBakM7QUFDRCxXQUxELHNCQWJLLEVBQVA7O0FBb0JELEtBckVjLG1CQUFqQiIsImZpbGUiOiJuby1kdXBsaWNhdGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlc29sdmUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9yZXNvbHZlJztcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnO1xuaW1wb3J0IHsgYXJyYXlGbGF0IH0gZnJvbSAnLi4vY29yZS91dGlscy9hcnJheSc7XG5cbi8qKlxuICogcmV0dXJucyBlaXRoZXIgYGltcG9ydGAgb3IgYHR5cGVgIHRva2VuLCBhcyBpblxuICpcbiAqIGltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG4gKiBvclxuICogaW1wb3J0IHR5cGUgeyBGQyB9IGZyb20gJ3JlYWN0J1xuICovXG5mdW5jdGlvbiBnZXRGaXJzdFN0YXRpY1Rva2VuKHRva2Vucykge1xuICBjb25zdCBmaXJzdFRva2VuID0gdG9rZW5zWzBdO1xuICBjb25zdCBzZWNvbmRUb2tlbiA9IHRva2Vuc1sxXTtcblxuICBpZiAoc2Vjb25kVG9rZW4gJiYgc2Vjb25kVG9rZW4udmFsdWUgPT09ICd0eXBlJykge1xuICAgIHJldHVybiBzZWNvbmRUb2tlbjtcbiAgfVxuXG4gIHJldHVybiBmaXJzdFRva2VuO1xufVxuXG4vKipcbiAqIHJldHVybiB0aGUgaW1wb3J0IHBhdGggdG9rZW4sIGUuZy4gJ3JlYWN0JyBhcyBpblxuICpcbiAqIGltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG4gKiBvclxuICogaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG4gKi9cbmZ1bmN0aW9uIGdldExhc3RTdGF0aWNUb2tlbih0b2tlbnMpIHtcbiAgY29uc3QgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICBpZiAoaXNQdW5jdHVhdG9yKGxhc3RUb2tlbiwgJzsnKSkge1xuICAgIHJldHVybiB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDJdO1xuICB9XG5cbiAgcmV0dXJuIGxhc3RUb2tlbjtcbn1cblxuLyoqXG4gKiBNZXJnZXMgc3BlY2lmaWVycyB0b2dldGhlciB0byBvbmUgc3RhdGVtZW50IGFuZCBzb3J0cyB0aGVtIGFscGhhYmV0aWNhbGx5XG4gKlxuICogQHJldHVybnMgZS5nLiBgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCBGQyB9YFxuICovXG5mdW5jdGlvbiBnZXROYW1lZFNwZWNpZmllcnNUZXh0KHNwZWNpZmllcnMpIHtcbiAgY29uc3Qgc3BlY2lmaWVySW5mb3MgPSBzcGVjaWZpZXJzXG4gICAgLmZpbHRlcihpbmZvID0+IGluZm8gJiYgIWluZm8uaXNFbXB0eSk7XG5cbiAgY29uc3Qgc2V0T2ZTcGVjaWZpZXJzID0gbmV3IFNldChcbiAgICBhcnJheUZsYXQoXG4gICAgICBzcGVjaWZpZXJJbmZvc1xuICAgICAgICAubWFwKGluZm8gPT4gaW5mby50ZXh0KVxuICAgICAgICAubWFwKHRleHQgPT4gdGV4dC5zcGxpdCgnLCcpKSxcbiAgICApXG4gICAgICAubWFwKHNwZWNpZmllciA9PiBzcGVjaWZpZXIudHJpbSgpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKSxcbiAgKTtcblxuICBsZXQgc3BlY2lmaWVyc1RleHQgPSBBcnJheS5mcm9tKHNldE9mU3BlY2lmaWVycy52YWx1ZXMoKSlcbiAgICAuc29ydCgpXG4gICAgLmpvaW4oJywgJyk7XG5cblxuICBpZiAoc3BlY2lmaWVyc1RleHQubGVuZ3RoID4gMCkge1xuICAgIHNwZWNpZmllcnNUZXh0ID0gYHsgJHtzcGVjaWZpZXJzVGV4dH0gfWA7XG4gIH1cblxuICByZXR1cm4gc3BlY2lmaWVyc1RleHQ7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGZpeCBjb21tYW5kcyB0byBjcmVhdGUgYSBuZXcgaW1wb3J0IHN0YXRlbWVudCBpbmNsdWRpbmdcbiAqIGFsbCBpbXBvcnQgc3BlY2lmaWVycyBpZiBhbnksIHBsdXMgdGhlIGRlZmF1bHQgaW1wb3J0IHNwZWNpZmllciBpZiBhbnkuXG4gKlxuICogVGhpcyBpcyBleHRyYSB1c2VmdWwgZm9yIHVzZXJzIHRoYXQgd2FudCB0byByZXNvbHZlIGEgbWVyZ2UgY29uZmxpY3RcbiAqIG9mIGltcG9ydHMuIE5vdyB0aGV5IGNhbiB1c2UgYEFjY2VwdCBib3RoYCBhbmQgbGV0IHRoaXMgcnVsZSBtZXJnZSBhbGxcbiAqIHRoZXNlIGltcG9ydHMgZm9yIHRoZW0gdGhhbmtzIHRvIGF1dG8tZml4LlxuICpcbiAqIERvZXMgbm90IHN1cHBvcnQgbWl4aW5nIHNwZWNpZmllcnMgYW5kIGNvbW1lbnRzXG4gKlxuICogZS5nLiBpbXBvcnQge1xuICogICAgdXNlU3RhdGUsIC8vIEkgbGlrZSB0aGlzIGhvb2tcbiAqICAgIHVzZUVmZmVjdCxcbiAqIH0gZnJvbSAncmVhY3QnXG4gKlxuICogTGluZXMgbGlrZSB0aGlzIHdpbGwgbm90IGdldCBhbiBhdXRvLWZpeFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUZpeENvbW1hbmRzVG9NZXJnZUltcG9ydHNJbnRvVGhlRmlyc3RPbmUoYXJncykge1xuICBjb25zdCB7XG4gICAgc3BlY2lmaWVycyxcbiAgICBkZWZhdWx0SW1wb3J0TmFtZSxcbiAgICBmaXhlcixcbiAgICBmaXJzdFN0YXRpY1Rva2VuLFxuICAgIGxhc3RTdGF0aWNUb2tlbixcbiAgfSA9IGFyZ3M7XG5cbiAgLyoqXG4gICAqIGUuZy4gYFJlYWN0LCB7IHVzZVN0YXRlIH1gXG4gICAqL1xuICBjb25zdCBzcGVjaWZpZXJzVGV4dCA9IFtkZWZhdWx0SW1wb3J0TmFtZSwgZ2V0TmFtZWRTcGVjaWZpZXJzVGV4dChzcGVjaWZpZXJzKV1cbiAgICAuZmlsdGVyKGl0ZW0gPT4gaXRlbSAmJiBpdGVtLmxlbmd0aCA+IDApXG4gICAgLmpvaW4oJywgJyk7XG5cbiAgaWYgKHNwZWNpZmllcnNUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIG5vIGZpeGVzXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIGUuZy4gYCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gYFxuICAgKi9cbiAgY29uc3QgZml4VGV4dCA9IGAgJHtzcGVjaWZpZXJzVGV4dH0gZnJvbSBgO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHRoZSByYW5nZSBvZiB0aGUgc3BlY2lmaWVycyB0ZXh0IG9mIHRoZSBmaXJzdCBpbXBvcnQgbGluZVxuICAgKiBlLmcuIGlmIHRoZSBmaXJzdCBpbXBvcnQgbGluZSBpc1xuICAgKlxuICAgKiBpbXBvcnQgeyB4eHggfSBmcm9tICdoZWxsbydcbiAgICpcbiAgICogVGhlbiB0aGlzIHJhbmdlIGlzIHRoZSByYW5nZSBvZiB0aGlzIHRleHQ6IGAgeyB4eHggfSBgXG4gICAqL1xuICBjb25zdCBzcGVjaWZpZXJzVGV4dFJhbmdlT2ZGaXJzdEltcG9ydFN0YXRlbWVudCA9IFtcbiAgICBmaXJzdFN0YXRpY1Rva2VuLnJhbmdlWzFdLFxuICAgIGxhc3RTdGF0aWNUb2tlbi5yYW5nZVswXSxcbiAgXTtcblxuICByZXR1cm4gW1xuICAgIGZpeGVyLnJlbW92ZVJhbmdlKHNwZWNpZmllcnNUZXh0UmFuZ2VPZkZpcnN0SW1wb3J0U3RhdGVtZW50KSxcbiAgICBmaXhlci5pbnNlcnRUZXh0QWZ0ZXIoZmlyc3RTdGF0aWNUb2tlbiwgZml4VGV4dCksXG4gIF07XG59XG5cbmZ1bmN0aW9uIGNoZWNrSW1wb3J0cyhpbXBvcnRlZCwgY29udGV4dCkge1xuICBmb3IgKGNvbnN0IFttb2R1bGUsIG5vZGVzXSBvZiBpbXBvcnRlZC5lbnRyaWVzKCkpIHtcbiAgICBpZiAobm9kZXMubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGAnJHttb2R1bGV9JyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcy5gO1xuICAgICAgY29uc3QgW2ZpcnN0LCAuLi5yZXN0XSA9IG5vZGVzO1xuICAgICAgY29uc3Qgc291cmNlQ29kZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpO1xuICAgICAgY29uc3QgZml4ID0gZ2V0Rml4KGZpcnN0LCByZXN0LCBzb3VyY2VDb2RlKTtcblxuICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICBub2RlOiBmaXJzdC5zb3VyY2UsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGZpeCwgLy8gQXR0YWNoIHRoZSBhdXRvZml4IChpZiBhbnkpIHRvIHRoZSBmaXJzdCBpbXBvcnQuXG4gICAgICB9KTtcblxuICAgICAgZm9yIChjb25zdCBub2RlIG9mIHJlc3QpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IG5vZGUuc291cmNlLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNJbmxpbmVDb21tZW50KGluZm8pIHtcbiAgcmV0dXJuIGluZm8gPyBpbmZvLnRleHQuaW5jbHVkZXMoJy8nKSA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXRGaXgoZmlyc3QsIHJlc3QsIHNvdXJjZUNvZGUpIHtcbiAgLy8gU29ycnkgRVNMaW50IDw9IDMgdXNlcnMsIG5vIGF1dG9maXggZm9yIHlvdS4gQXV0b2ZpeGluZyBkdXBsaWNhdGUgaW1wb3J0c1xuICAvLyByZXF1aXJlcyBtdWx0aXBsZSBgZml4ZXIud2hhdGV2ZXIoKWAgY2FsbHMgaW4gdGhlIGBmaXhgOiBXZSBib3RoIG5lZWQgdG9cbiAgLy8gdXBkYXRlIHRoZSBmaXJzdCBvbmUsIGFuZCByZW1vdmUgdGhlIHJlc3QuIFN1cHBvcnQgZm9yIG11bHRpcGxlXG4gIC8vIGBmaXhlci53aGF0ZXZlcigpYCBpbiBhIHNpbmdsZSBgZml4YCB3YXMgYWRkZWQgaW4gRVNMaW50IDQuMS5cbiAgLy8gYHNvdXJjZUNvZGUuZ2V0Q29tbWVudHNCZWZvcmVgIHdhcyBhZGRlZCBpbiA0LjAsIHNvIHRoYXQncyBhbiBlYXN5IHRoaW5nIHRvXG4gIC8vIGNoZWNrIGZvci5cbiAgaWYgKHR5cGVvZiBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIEFkanVzdGluZyB0aGUgZmlyc3QgaW1wb3J0IG1pZ2h0IG1ha2UgaXQgbXVsdGlsaW5lLCB3aGljaCBjb3VsZCBicmVha1xuICAvLyBgZXNsaW50LWRpc2FibGUtbmV4dC1saW5lYCBjb21tZW50cyBhbmQgc2ltaWxhciwgc28gYmFpbCBpZiB0aGUgZmlyc3RcbiAgLy8gaW1wb3J0IGhhcyBjb21tZW50cy4gQWxzbywgaWYgdGhlIGZpcnN0IGltcG9ydCBpcyBgaW1wb3J0ICogYXMgbnMgZnJvbVxuICAvLyAnLi9mb28nYCB0aGVyZSdzIG5vdGhpbmcgd2UgY2FuIGRvLlxuICBpZiAoaGFzUHJvYmxlbWF0aWNDb21tZW50cyhmaXJzdCwgc291cmNlQ29kZSkgfHwgaGFzTmFtZXNwYWNlKGZpcnN0KSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkZWZhdWx0SW1wb3J0TmFtZXMgPSBuZXcgU2V0KFxuICAgIFtmaXJzdCwgLi4ucmVzdF0ubWFwKGdldERlZmF1bHRJbXBvcnROYW1lKS5maWx0ZXIoQm9vbGVhbiksXG4gICk7XG5cbiAgLy8gQmFpbCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZGlmZmVyZW50IGRlZmF1bHQgaW1wb3J0IG5hbWVzIOKAkyBpdCdzIHVwIHRvIHRoZVxuICAvLyB1c2VyIHRvIGNob29zZSB3aGljaCBvbmUgdG8ga2VlcC5cbiAgaWYgKGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID4gMSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBMZWF2ZSBpdCB0byB0aGUgdXNlciB0byBoYW5kbGUgY29tbWVudHMuIEFsc28gc2tpcCBgaW1wb3J0ICogYXMgbnMgZnJvbVxuICAvLyAnLi9mb28nYCBpbXBvcnRzLCBzaW5jZSB0aGV5IGNhbm5vdCBiZSBtZXJnZWQgaW50byBhbm90aGVyIGltcG9ydC5cbiAgY29uc3QgcmVzdFdpdGhvdXRDb21tZW50cyA9IHJlc3QuZmlsdGVyKG5vZGUgPT4gIShcbiAgICBoYXNQcm9ibGVtYXRpY0NvbW1lbnRzKG5vZGUsIHNvdXJjZUNvZGUpIHx8XG4gICAgaGFzTmFtZXNwYWNlKG5vZGUpXG4gICkpO1xuXG4gIGZ1bmN0aW9uIGdldFNwZWNpZmllckluZm8obm9kZSkge1xuICAgIGNvbnN0IHRva2VucyA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5zKG5vZGUpO1xuICAgIGNvbnN0IG9wZW5CcmFjZSA9IHRva2Vucy5maW5kKHRva2VuID0+IGlzUHVuY3R1YXRvcih0b2tlbiwgJ3snKSk7XG4gICAgY29uc3QgY2xvc2VCcmFjZSA9IHRva2Vucy5maW5kKHRva2VuID0+IGlzUHVuY3R1YXRvcih0b2tlbiwgJ30nKSk7XG5cbiAgICBpZiAob3BlbkJyYWNlID09IG51bGwgfHwgY2xvc2VCcmFjZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBpbXBvcnROb2RlOiBub2RlLFxuICAgICAgdGV4dDogc291cmNlQ29kZS50ZXh0LnNsaWNlKG9wZW5CcmFjZS5yYW5nZVsxXSwgY2xvc2VCcmFjZS5yYW5nZVswXSksXG4gICAgICBoYXNUcmFpbGluZ0NvbW1hOiBpc1B1bmN0dWF0b3Ioc291cmNlQ29kZS5nZXRUb2tlbkJlZm9yZShjbG9zZUJyYWNlKSwgJywnKSxcbiAgICAgIGlzRW1wdHk6ICFoYXNTcGVjaWZpZXJzKG5vZGUpLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBzcGVjaWZpZXJzID0gcmVzdFdpdGhvdXRDb21tZW50c1xuICAgIC5tYXAoZ2V0U3BlY2lmaWVySW5mbylcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGNvbnN0IHVubmVjZXNzYXJ5SW1wb3J0cyA9IHJlc3RXaXRob3V0Q29tbWVudHMuZmlsdGVyKG5vZGUgPT5cbiAgICAhaGFzU3BlY2lmaWVycyhub2RlKSAmJlxuICAgICFoYXNOYW1lc3BhY2Uobm9kZSkgJiZcbiAgICAhc3BlY2lmaWVycy5zb21lKHNwZWNpZmllciA9PiBzcGVjaWZpZXIuaW1wb3J0Tm9kZSA9PT0gbm9kZSksXG4gICk7XG5cbiAgY29uc3Qgc2hvdWxkQWRkRGVmYXVsdCA9IGdldERlZmF1bHRJbXBvcnROYW1lKGZpcnN0KSA9PSBudWxsICYmIGRlZmF1bHRJbXBvcnROYW1lcy5zaXplID09PSAxO1xuICBjb25zdCBzaG91bGRBZGRTcGVjaWZpZXJzID0gc3BlY2lmaWVycy5sZW5ndGggPiAwO1xuICBjb25zdCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSA9IHVubmVjZXNzYXJ5SW1wb3J0cy5sZW5ndGggPiAwO1xuXG4gIGlmICghKHNob3VsZEFkZERlZmF1bHQgfHwgc2hvdWxkQWRkU3BlY2lmaWVycyB8fCBzaG91bGRSZW1vdmVVbm5lY2Vzc2FyeSkpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGZpeGVyID0+IHtcbiAgICBjb25zdCB0b2tlbnMgPSBzb3VyY2VDb2RlLmdldFRva2VucyhmaXJzdCk7XG4gICAgY29uc3QgZmlyc3RTdGF0aWNUb2tlbiA9IGdldEZpcnN0U3RhdGljVG9rZW4odG9rZW5zKTtcbiAgICBjb25zdCBsYXN0U3RhdGljVG9rZW4gPSBnZXRMYXN0U3RhdGljVG9rZW4odG9rZW5zKTtcblxuICAgIGNvbnN0IFtkZWZhdWx0SW1wb3J0TmFtZV0gPSBkZWZhdWx0SW1wb3J0TmFtZXM7XG4gICAgY29uc3QgZmlyc3RTcGVjaWZpZXIgPSBnZXRTcGVjaWZpZXJJbmZvKGZpcnN0KTtcblxuICAgIGlmIChoYXNJbmxpbmVDb21tZW50KGZpcnN0U3BlY2lmaWVyKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHNwZWNpZmllcnNXaXRob3V0SW5saW5lQ29tbWVudHMgPSBzcGVjaWZpZXJzXG4gICAgICAuZmlsdGVyKGluZm8gPT4gIWhhc0lubGluZUNvbW1lbnQoaW5mbykpO1xuXG4gICAgY29uc3QgZml4ZXMgPSBbXTtcblxuICAgIGlmIChzaG91bGRBZGREZWZhdWx0IHx8IHNob3VsZEFkZFNwZWNpZmllcnMpIHtcbiAgICAgIGdlbmVyYXRlRml4Q29tbWFuZHNUb01lcmdlSW1wb3J0c0ludG9UaGVGaXJzdE9uZSh7XG4gICAgICAgIHNwZWNpZmllcnM6IFsuLi5zcGVjaWZpZXJzV2l0aG91dElubGluZUNvbW1lbnRzLCBmaXJzdFNwZWNpZmllcl0sXG4gICAgICAgIGRlZmF1bHRJbXBvcnROYW1lLFxuICAgICAgICBmaXhlcixcbiAgICAgICAgZmlyc3RTdGF0aWNUb2tlbixcbiAgICAgICAgbGFzdFN0YXRpY1Rva2VuLFxuICAgICAgfSkuZm9yRWFjaChmaXggPT4gZml4ZXMucHVzaChmaXgpKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgaW1wb3J0cyB3aG9zZSBzcGVjaWZpZXJzIGhhdmUgYmVlbiBtb3ZlZCBpbnRvIHRoZSBmaXJzdCBpbXBvcnQuXG4gICAgZm9yIChjb25zdCBzcGVjaWZpZXIgb2Ygc3BlY2lmaWVyc1dpdGhvdXRJbmxpbmVDb21tZW50cykge1xuICAgICAgY29uc3QgaW1wb3J0Tm9kZSA9IHNwZWNpZmllci5pbXBvcnROb2RlO1xuICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmUoaW1wb3J0Tm9kZSkpO1xuXG4gICAgICBjb25zdCBjaGFyQWZ0ZXJJbXBvcnRSYW5nZSA9IFtpbXBvcnROb2RlLnJhbmdlWzFdLCBpbXBvcnROb2RlLnJhbmdlWzFdICsgMV07XG4gICAgICBjb25zdCBjaGFyQWZ0ZXJJbXBvcnQgPSBzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKFxuICAgICAgICBjaGFyQWZ0ZXJJbXBvcnRSYW5nZVswXSxcbiAgICAgICAgY2hhckFmdGVySW1wb3J0UmFuZ2VbMV0sXG4gICAgICApO1xuXG4gICAgICBpZiAoY2hhckFmdGVySW1wb3J0ID09PSAnXFxuJykge1xuICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLnJlbW92ZVJhbmdlKGNoYXJBZnRlckltcG9ydFJhbmdlKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGltcG9ydHMgd2hvc2UgZGVmYXVsdCBpbXBvcnQgaGFzIGJlZW4gbW92ZWQgdG8gdGhlIGZpcnN0IGltcG9ydCxcbiAgICAvLyBhbmQgc2lkZS1lZmZlY3Qtb25seSBpbXBvcnRzIHRoYXQgYXJlIHVubmVjZXNzYXJ5IGR1ZSB0byB0aGUgZmlyc3RcbiAgICAvLyBpbXBvcnQuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIHVubmVjZXNzYXJ5SW1wb3J0cykge1xuICAgICAgZml4ZXMucHVzaChmaXhlci5yZW1vdmUobm9kZSkpO1xuXG4gICAgICBjb25zdCBjaGFyQWZ0ZXJJbXBvcnRSYW5nZSA9IFtub2RlLnJhbmdlWzFdLCBub2RlLnJhbmdlWzFdICsgMV07XG4gICAgICBjb25zdCBjaGFyQWZ0ZXJJbXBvcnQgPSBzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKFxuICAgICAgICBjaGFyQWZ0ZXJJbXBvcnRSYW5nZVswXSxcbiAgICAgICAgY2hhckFmdGVySW1wb3J0UmFuZ2VbMV0sXG4gICAgICApO1xuXG4gICAgICBpZiAoY2hhckFmdGVySW1wb3J0ID09PSAnXFxuJykge1xuICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLnJlbW92ZVJhbmdlKGNoYXJBZnRlckltcG9ydFJhbmdlKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpeGVzO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpc1B1bmN0dWF0b3Iobm9kZSwgdmFsdWUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ1B1bmN0dWF0b3InICYmIG5vZGUudmFsdWUgPT09IHZhbHVlO1xufVxuXG4vLyBHZXQgdGhlIG5hbWUgb2YgdGhlIGRlZmF1bHQgaW1wb3J0IG9mIGBub2RlYCwgaWYgYW55LlxuZnVuY3Rpb24gZ2V0RGVmYXVsdEltcG9ydE5hbWUobm9kZSkge1xuICBjb25zdCBkZWZhdWx0U3BlY2lmaWVyID0gbm9kZS5zcGVjaWZpZXJzXG4gICAgLmZpbmQoc3BlY2lmaWVyID0+IHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcicpO1xuICByZXR1cm4gZGVmYXVsdFNwZWNpZmllciAhPSBudWxsID8gZGVmYXVsdFNwZWNpZmllci5sb2NhbC5uYW1lIDogdW5kZWZpbmVkO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGEgbmFtZXNwYWNlIGltcG9ydC5cbmZ1bmN0aW9uIGhhc05hbWVzcGFjZShub2RlKSB7XG4gIGNvbnN0IHNwZWNpZmllcnMgPSBub2RlLnNwZWNpZmllcnNcbiAgICAuZmlsdGVyKHNwZWNpZmllciA9PiBzcGVjaWZpZXIudHlwZSA9PT0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcicpO1xuICByZXR1cm4gc3BlY2lmaWVycy5sZW5ndGggPiAwO1xufVxuXG4vLyBDaGVja3Mgd2hldGhlciBgbm9kZWAgaGFzIGFueSBub24tZGVmYXVsdCBzcGVjaWZpZXJzLlxuZnVuY3Rpb24gaGFzU3BlY2lmaWVycyhub2RlKSB7XG4gIGNvbnN0IHNwZWNpZmllcnMgPSBub2RlLnNwZWNpZmllcnNcbiAgICAuZmlsdGVyKHNwZWNpZmllciA9PiBzcGVjaWZpZXIudHlwZSA9PT0gJ0ltcG9ydFNwZWNpZmllcicpO1xuICByZXR1cm4gc3BlY2lmaWVycy5sZW5ndGggPiAwO1xufVxuXG4vLyBJdCdzIG5vdCBvYnZpb3VzIHdoYXQgdGhlIHVzZXIgd2FudHMgdG8gZG8gd2l0aCBjb21tZW50cyBhc3NvY2lhdGVkIHdpdGhcbi8vIGR1cGxpY2F0ZSBpbXBvcnRzLCBzbyBza2lwIGltcG9ydHMgd2l0aCBjb21tZW50cyB3aGVuIGF1dG9maXhpbmcuXG5mdW5jdGlvbiBoYXNQcm9ibGVtYXRpY0NvbW1lbnRzKG5vZGUsIHNvdXJjZUNvZGUpIHtcbiAgcmV0dXJuIChcbiAgICBoYXNDb21tZW50QmVmb3JlKG5vZGUsIHNvdXJjZUNvZGUpIHx8XG4gICAgaGFzQ29tbWVudEFmdGVyKG5vZGUsIHNvdXJjZUNvZGUpIHx8XG4gICAgaGFzQ29tbWVudEluc2lkZU5vblNwZWNpZmllcnMobm9kZSwgc291cmNlQ29kZSlcbiAgKTtcbn1cblxuLy8gQ2hlY2tzIHdoZXRoZXIgYG5vZGVgIGhhcyBhIGNvbW1lbnQgKHRoYXQgZW5kcykgb24gdGhlIHByZXZpb3VzIGxpbmUgb3Igb25cbi8vIHRoZSBzYW1lIGxpbmUgYXMgYG5vZGVgIChzdGFydHMpLlxuZnVuY3Rpb24gaGFzQ29tbWVudEJlZm9yZShub2RlLCBzb3VyY2VDb2RlKSB7XG4gIHJldHVybiBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlKG5vZGUpXG4gICAgLnNvbWUoY29tbWVudCA9PiBjb21tZW50LmxvYy5lbmQubGluZSA+PSBub2RlLmxvYy5zdGFydC5saW5lIC0gMSk7XG59XG5cbi8vIENoZWNrcyB3aGV0aGVyIGBub2RlYCBoYXMgYSBjb21tZW50ICh0aGF0IHN0YXJ0cykgb24gdGhlIHNhbWUgbGluZSBhcyBgbm9kZWBcbi8vIChlbmRzKS5cbmZ1bmN0aW9uIGhhc0NvbW1lbnRBZnRlcihub2RlLCBzb3VyY2VDb2RlKSB7XG4gIHJldHVybiBzb3VyY2VDb2RlLmdldENvbW1lbnRzQWZ0ZXIobm9kZSlcbiAgICAuc29tZShjb21tZW50ID0+IGNvbW1lbnQubG9jLnN0YXJ0LmxpbmUgPT09IG5vZGUubG9jLmVuZC5saW5lKTtcbn1cblxuLy8gQ2hlY2tzIHdoZXRoZXIgYG5vZGVgIGhhcyBhbnkgY29tbWVudHMgX2luc2lkZSxfIGV4Y2VwdCBpbnNpZGUgdGhlIGB7Li4ufWBcbi8vIHBhcnQgKGlmIGFueSkuXG5mdW5jdGlvbiBoYXNDb21tZW50SW5zaWRlTm9uU3BlY2lmaWVycyhub2RlLCBzb3VyY2VDb2RlKSB7XG4gIGNvbnN0IHRva2VucyA9IHNvdXJjZUNvZGUuZ2V0VG9rZW5zKG5vZGUpO1xuICBjb25zdCBvcGVuQnJhY2VJbmRleCA9IHRva2Vucy5maW5kSW5kZXgodG9rZW4gPT4gaXNQdW5jdHVhdG9yKHRva2VuLCAneycpKTtcbiAgY29uc3QgY2xvc2VCcmFjZUluZGV4ID0gdG9rZW5zLmZpbmRJbmRleCh0b2tlbiA9PiBpc1B1bmN0dWF0b3IodG9rZW4sICd9JykpO1xuICAvLyBTbGljZSBhd2F5IHRoZSBmaXJzdCB0b2tlbiwgc2luY2Ugd2UncmUgbm8gbG9va2luZyBmb3IgY29tbWVudHMgX2JlZm9yZV9cbiAgLy8gYG5vZGVgIChvbmx5IGluc2lkZSkuIElmIHRoZXJlJ3MgYSBgey4uLn1gIHBhcnQsIGxvb2sgZm9yIGNvbW1lbnRzIGJlZm9yZVxuICAvLyB0aGUgYHtgLCBidXQgbm90IGJlZm9yZSB0aGUgYH1gIChoZW5jZSB0aGUgYCsxYHMpLlxuICBjb25zdCBzb21lVG9rZW5zID0gb3BlbkJyYWNlSW5kZXggPj0gMCAmJiBjbG9zZUJyYWNlSW5kZXggPj0gMFxuICAgID8gdG9rZW5zLnNsaWNlKDEsIG9wZW5CcmFjZUluZGV4ICsgMSkuY29uY2F0KHRva2Vucy5zbGljZShjbG9zZUJyYWNlSW5kZXggKyAxKSlcbiAgICA6IHRva2Vucy5zbGljZSgxKTtcbiAgcmV0dXJuIHNvbWVUb2tlbnMuc29tZSh0b2tlbiA9PiBzb3VyY2VDb2RlLmdldENvbW1lbnRzQmVmb3JlKHRva2VuKS5sZW5ndGggPiAwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1kdXBsaWNhdGVzJyksXG4gICAgfSxcbiAgICBmaXhhYmxlOiAnY29kZScsXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgY29uc2lkZXJRdWVyeVN0cmluZzoge1xuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGUoY29udGV4dCkge1xuICAgIC8vIFByZXBhcmUgdGhlIHJlc29sdmVyIGZyb20gb3B0aW9ucy5cbiAgICBjb25zdCBjb25zaWRlclF1ZXJ5U3RyaW5nT3B0aW9uID0gY29udGV4dC5vcHRpb25zWzBdICYmXG4gICAgICBjb250ZXh0Lm9wdGlvbnNbMF1bJ2NvbnNpZGVyUXVlcnlTdHJpbmcnXTtcbiAgICBjb25zdCBkZWZhdWx0UmVzb2x2ZXIgPSBzb3VyY2VQYXRoID0+IHJlc29sdmUoc291cmNlUGF0aCwgY29udGV4dCkgfHwgc291cmNlUGF0aDtcbiAgICBjb25zdCByZXNvbHZlciA9IGNvbnNpZGVyUXVlcnlTdHJpbmdPcHRpb24gPyAoc291cmNlUGF0aCA9PiB7XG4gICAgICBjb25zdCBwYXJ0cyA9IHNvdXJjZVBhdGgubWF0Y2goL14oW14/XSopXFw/KC4qKSQvKTtcbiAgICAgIGlmICghcGFydHMpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRSZXNvbHZlcihzb3VyY2VQYXRoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWZhdWx0UmVzb2x2ZXIocGFydHNbMV0pICsgJz8nICsgcGFydHNbMl07XG4gICAgfSkgOiBkZWZhdWx0UmVzb2x2ZXI7XG5cbiAgICBjb25zdCBpbXBvcnRlZCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBuc0ltcG9ydGVkID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGRlZmF1bHRUeXBlc0ltcG9ydGVkID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IG5hbWVkVHlwZXNJbXBvcnRlZCA9IG5ldyBNYXAoKTtcblxuICAgIGZ1bmN0aW9uIGdldEltcG9ydE1hcChuKSB7XG4gICAgICBpZiAobi5pbXBvcnRLaW5kID09PSAndHlwZScpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBuLnNwZWNpZmllcnMubGVuZ3RoID4gMFxuICAgICAgICAgICYmIG4uc3BlY2lmaWVyc1swXS50eXBlID09PSAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcidcbiAgICAgICAgKSA/IGRlZmF1bHRUeXBlc0ltcG9ydGVkIDogbmFtZWRUeXBlc0ltcG9ydGVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGFzTmFtZXNwYWNlKG4pID8gbnNJbXBvcnRlZCA6IGltcG9ydGVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBJbXBvcnREZWNsYXJhdGlvbihuKSB7XG4gICAgICAgIC8vIHJlc29sdmVkIHBhdGggd2lsbCBjb3ZlciBhbGlhc2VkIGR1cGxpY2F0ZXNcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZXIobi5zb3VyY2UudmFsdWUpO1xuICAgICAgICBjb25zdCBpbXBvcnRNYXAgPSBnZXRJbXBvcnRNYXAobik7XG5cbiAgICAgICAgaWYgKGltcG9ydE1hcC5oYXMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICAgIGltcG9ydE1hcC5nZXQocmVzb2x2ZWRQYXRoKS5wdXNoKG4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltcG9ydE1hcC5zZXQocmVzb2x2ZWRQYXRoLCBbbl0pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAnUHJvZ3JhbTpleGl0JzogZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGVja0ltcG9ydHMoaW1wb3J0ZWQsIGNvbnRleHQpO1xuICAgICAgICBjaGVja0ltcG9ydHMobnNJbXBvcnRlZCwgY29udGV4dCk7XG4gICAgICAgIGNoZWNrSW1wb3J0cyhkZWZhdWx0VHlwZXNJbXBvcnRlZCwgY29udGV4dCk7XG4gICAgICAgIGNoZWNrSW1wb3J0cyhuYW1lZFR5cGVzSW1wb3J0ZWQsIGNvbnRleHQpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==