'use strict';




var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}} /**
                                                                                                                                                                                                                                                                                                                                                                                 * @fileoverview Rule to disallow namespace import
                                                                                                                                                                                                                                                                                                                                                                                 * @author Radek Benkel
                                                                                                                                                                                                                                                                                                                                                                                 */ //------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2['default'])('no-namespace') },

    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        ignore: {
          type: 'array',
          items: {
            type: 'string' },

          uniqueItems: true } } }] },





  create: function () {function create(context) {
      var firstOption = context.options[0] || {};
      var ignoreGlobs = firstOption.ignore;

      return {
        ImportNamespaceSpecifier: function () {function ImportNamespaceSpecifier(node) {
            if (ignoreGlobs && ignoreGlobs.find(function (glob) {return (0, _minimatch2['default'])(node.parent.source.value, glob, { matchBase: true });})) {
              return;
            }

            var scopeVariables = context.getScope().variables;
            var namespaceVariable = scopeVariables.find(function (variable) {return variable.defs[0].node === node;});
            var namespaceReferences = namespaceVariable.references;
            var namespaceIdentifiers = namespaceReferences.map(function (reference) {return reference.identifier;});
            var canFix = namespaceIdentifiers.length > 0 && !usesNamespaceAsObject(namespaceIdentifiers);

            context.report({
              node: node,
              message: 'Unexpected namespace import.',
              fix: canFix && function (fixer) {
                var scopeManager = context.getSourceCode().scopeManager;
                var fixes = [];

                // Pass 1: Collect variable names that are already in scope for each reference we want
                // to transform, so that we can be sure that we choose non-conflicting import names
                var importNameConflicts = {};
                namespaceIdentifiers.forEach(function (identifier) {
                  var parent = identifier.parent;
                  if (parent && parent.type === 'MemberExpression') {
                    var importName = getMemberPropertyName(parent);
                    var localConflicts = getVariableNamesInScope(scopeManager, parent);
                    if (!importNameConflicts[importName]) {
                      importNameConflicts[importName] = localConflicts;
                    } else {
                      localConflicts.forEach(function (c) {return importNameConflicts[importName].add(c);});
                    }
                  }
                });

                // Choose new names for each import
                var importNames = Object.keys(importNameConflicts);
                var importLocalNames = generateLocalNames(
                importNames,
                importNameConflicts,
                namespaceVariable.name);


                // Replace the ImportNamespaceSpecifier with a list of ImportSpecifiers
                var namedImportSpecifiers = importNames.map(function (importName) {return (
                    importName === importLocalNames[importName] ?
                    importName : String(
                    importName) + ' as ' + String(importLocalNames[importName]));});

                fixes.push(fixer.replaceText(node, '{ ' + String(namedImportSpecifiers.join(', ')) + ' }'));

                // Pass 2: Replace references to the namespace with references to the named imports
                namespaceIdentifiers.forEach(function (identifier) {
                  var parent = identifier.parent;
                  if (parent && parent.type === 'MemberExpression') {
                    var importName = getMemberPropertyName(parent);
                    fixes.push(fixer.replaceText(parent, importLocalNames[importName]));
                  }
                });

                return fixes;
              } });

          }return ImportNamespaceSpecifier;}() };

    }return create;}() };


/**
                           * @param {Identifier[]} namespaceIdentifiers
                           * @returns {boolean} `true` if the namespace variable is more than just a glorified constant
                           */
function usesNamespaceAsObject(namespaceIdentifiers) {
  return !namespaceIdentifiers.every(function (identifier) {
    var parent = identifier.parent;

    // `namespace.x` or `namespace['x']`
    return (
      parent && parent.type === 'MemberExpression' && (
      parent.property.type === 'Identifier' || parent.property.type === 'Literal'));

  });
}

/**
   * @param {MemberExpression} memberExpression
   * @returns {string} the name of the member in the object expression, e.g. the `x` in `namespace.x`
   */
function getMemberPropertyName(memberExpression) {
  return memberExpression.property.type === 'Identifier' ?
  memberExpression.property.name :
  memberExpression.property.value;
}

/**
   * @param {ScopeManager} scopeManager
   * @param {ASTNode} node
   * @return {Set<string>}
   */
function getVariableNamesInScope(scopeManager, node) {
  var currentNode = node;
  var scope = scopeManager.acquire(currentNode);
  while (scope == null) {
    currentNode = currentNode.parent;
    scope = scopeManager.acquire(currentNode, true);
  }
  return new Set([].concat(_toConsumableArray(
  scope.variables.map(function (variable) {return variable.name;})), _toConsumableArray(
  scope.upper.variables.map(function (variable) {return variable.name;}))));

}

/**
   *
   * @param {*} names
   * @param {*} nameConflicts
   * @param {*} namespaceName
   */
function generateLocalNames(names, nameConflicts, namespaceName) {
  var localNames = {};
  names.forEach(function (name) {
    var localName = void 0;
    if (!nameConflicts[name].has(name)) {
      localName = name;
    } else if (!nameConflicts[name].has(String(namespaceName) + '_' + String(name))) {
      localName = String(namespaceName) + '_' + String(name);
    } else {
      for (var i = 1; i < Infinity; i++) {
        if (!nameConflicts[name].has(String(namespaceName) + '_' + String(name) + '_' + String(i))) {
          localName = String(namespaceName) + '_' + String(name) + '_' + String(i);
          break;
        }
      }
    }
    localNames[name] = localName;
  });
  return localNames;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsImZpeGFibGUiLCJzY2hlbWEiLCJwcm9wZXJ0aWVzIiwiaWdub3JlIiwiaXRlbXMiLCJ1bmlxdWVJdGVtcyIsImNyZWF0ZSIsImNvbnRleHQiLCJmaXJzdE9wdGlvbiIsIm9wdGlvbnMiLCJpZ25vcmVHbG9icyIsIkltcG9ydE5hbWVzcGFjZVNwZWNpZmllciIsIm5vZGUiLCJmaW5kIiwicGFyZW50Iiwic291cmNlIiwidmFsdWUiLCJnbG9iIiwibWF0Y2hCYXNlIiwic2NvcGVWYXJpYWJsZXMiLCJnZXRTY29wZSIsInZhcmlhYmxlcyIsIm5hbWVzcGFjZVZhcmlhYmxlIiwidmFyaWFibGUiLCJkZWZzIiwibmFtZXNwYWNlUmVmZXJlbmNlcyIsInJlZmVyZW5jZXMiLCJuYW1lc3BhY2VJZGVudGlmaWVycyIsIm1hcCIsInJlZmVyZW5jZSIsImlkZW50aWZpZXIiLCJjYW5GaXgiLCJsZW5ndGgiLCJ1c2VzTmFtZXNwYWNlQXNPYmplY3QiLCJyZXBvcnQiLCJtZXNzYWdlIiwiZml4Iiwic2NvcGVNYW5hZ2VyIiwiZ2V0U291cmNlQ29kZSIsImZpeGVzIiwiaW1wb3J0TmFtZUNvbmZsaWN0cyIsImZvckVhY2giLCJpbXBvcnROYW1lIiwiZ2V0TWVtYmVyUHJvcGVydHlOYW1lIiwibG9jYWxDb25mbGljdHMiLCJnZXRWYXJpYWJsZU5hbWVzSW5TY29wZSIsImMiLCJhZGQiLCJpbXBvcnROYW1lcyIsIk9iamVjdCIsImtleXMiLCJpbXBvcnRMb2NhbE5hbWVzIiwiZ2VuZXJhdGVMb2NhbE5hbWVzIiwibmFtZSIsIm5hbWVkSW1wb3J0U3BlY2lmaWVycyIsInB1c2giLCJmaXhlciIsInJlcGxhY2VUZXh0Iiwiam9pbiIsImV2ZXJ5IiwicHJvcGVydHkiLCJtZW1iZXJFeHByZXNzaW9uIiwiY3VycmVudE5vZGUiLCJzY29wZSIsImFjcXVpcmUiLCJTZXQiLCJ1cHBlciIsIm5hbWVzIiwibmFtZUNvbmZsaWN0cyIsIm5hbWVzcGFjZU5hbWUiLCJsb2NhbE5hbWVzIiwibG9jYWxOYW1lIiwiaGFzIiwiaSIsIkluZmluaXR5Il0sIm1hcHBpbmdzIjoiOzs7OztBQUtBLHNDO0FBQ0EscUMsMlVBTkE7OztvWEFRQTtBQUNBO0FBQ0E7O0FBR0FBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFlBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLDBCQUFRLGNBQVIsQ0FERCxFQUZGOztBQUtKQyxhQUFTLE1BTEw7QUFNSkMsWUFBUSxDQUFDO0FBQ1BKLFlBQU0sUUFEQztBQUVQSyxrQkFBWTtBQUNWQyxnQkFBUTtBQUNOTixnQkFBTSxPQURBO0FBRU5PLGlCQUFPO0FBQ0xQLGtCQUFNLFFBREQsRUFGRDs7QUFLTlEsdUJBQWEsSUFMUCxFQURFLEVBRkwsRUFBRCxDQU5KLEVBRFM7Ozs7OztBQXFCZkMsUUFyQmUsK0JBcUJSQyxPQXJCUSxFQXFCQztBQUNkLFVBQU1DLGNBQWNELFFBQVFFLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFBMUM7QUFDQSxVQUFNQyxjQUFjRixZQUFZTCxNQUFoQzs7QUFFQSxhQUFPO0FBQ0xRLGdDQURLLGlEQUNvQkMsSUFEcEIsRUFDMEI7QUFDN0IsZ0JBQUlGLGVBQWVBLFlBQVlHLElBQVosQ0FBaUIsd0JBQVEsNEJBQVVELEtBQUtFLE1BQUwsQ0FBWUMsTUFBWixDQUFtQkMsS0FBN0IsRUFBb0NDLElBQXBDLEVBQTBDLEVBQUVDLFdBQVcsSUFBYixFQUExQyxDQUFSLEVBQWpCLENBQW5CLEVBQTZHO0FBQzNHO0FBQ0Q7O0FBRUQsZ0JBQU1DLGlCQUFpQlosUUFBUWEsUUFBUixHQUFtQkMsU0FBMUM7QUFDQSxnQkFBTUMsb0JBQW9CSCxlQUFlTixJQUFmLENBQW9CLFVBQUNVLFFBQUQsVUFBY0EsU0FBU0MsSUFBVCxDQUFjLENBQWQsRUFBaUJaLElBQWpCLEtBQTBC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QUVPLElBQUksQ0FBQ2UsY0FBY2YsSUFBZCxFQUFvQm1CLEdBQXBCLFFBQTJCSCxhQUEzQixpQkFBNENoQixJQUE1QyxFQUFMLEVBQTBEO0FBQy9Ea0IseUJBQWVGLGFBQWYsaUJBQWdDaEIsSUFBaEM7QUFDRCxLQUZNLE1BRUE7QUFDTCxXQUFLLElBQUlvQixJQUFJLENBQWIsRUFBZ0JBLElBQUlDLFFBQXBCLEVBQThCRCxHQUE5QixFQUFtQztBQUNqQyxZQUFJLENBQUNMLGNBQWNmLElBQWQsRUFBb0JtQixHQUFwQixRQUEyQkgsYUFBM0IsaUJBQTRDaEIsSUFBNUMsaUJBQW9Eb0IsQ0FBcEQsRUFBTCxFQUErRDtBQUM3REYsNkJBQWVGLGFBQWYsaUJBQWdDaEIsSUFBaEMsaUJBQXdDb0IsQ0FBeEM7QUFDQTtBQUNEO0FBQ0Y7QUFDRjtBQUNESCxlQUFXakIsSUFBWCxJQUFtQmtCLFNBQW5CO0FBQ0QsR0FmRDtBQWdCQSxTQUFPRCxVQUFQO0FBQ0QiLCJmaWxlIjoibm8tbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gZGlzYWxsb3cgbmFtZXNwYWNlIGltcG9ydFxuICogQGF1dGhvciBSYWRlayBCZW5rZWxcbiAqL1xuXG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJztcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFJ1bGUgRGVmaW5pdGlvblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25vLW5hbWVzcGFjZScpLFxuICAgIH0sXG4gICAgZml4YWJsZTogJ2NvZGUnLFxuICAgIHNjaGVtYTogW3tcbiAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICBpZ25vcmU6IHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHVuaXF1ZUl0ZW1zOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9XSxcbiAgfSxcblxuICBjcmVhdGUoY29udGV4dCkge1xuICAgIGNvbnN0IGZpcnN0T3B0aW9uID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9O1xuICAgIGNvbnN0IGlnbm9yZUdsb2JzID0gZmlyc3RPcHRpb24uaWdub3JlO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIEltcG9ydE5hbWVzcGFjZVNwZWNpZmllcihub2RlKSB7XG4gICAgICAgIGlmIChpZ25vcmVHbG9icyAmJiBpZ25vcmVHbG9icy5maW5kKGdsb2IgPT4gbWluaW1hdGNoKG5vZGUucGFyZW50LnNvdXJjZS52YWx1ZSwgZ2xvYiwgeyBtYXRjaEJhc2U6IHRydWUgfSkpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NvcGVWYXJpYWJsZXMgPSBjb250ZXh0LmdldFNjb3BlKCkudmFyaWFibGVzO1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VWYXJpYWJsZSA9IHNjb3BlVmFyaWFibGVzLmZpbmQoKHZhcmlhYmxlKSA9PiB2YXJpYWJsZS5kZWZzWzBdLm5vZGUgPT09IG5vZGUpO1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VSZWZlcmVuY2VzID0gbmFtZXNwYWNlVmFyaWFibGUucmVmZXJlbmNlcztcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlSWRlbnRpZmllcnMgPSBuYW1lc3BhY2VSZWZlcmVuY2VzLm1hcChyZWZlcmVuY2UgPT4gcmVmZXJlbmNlLmlkZW50aWZpZXIpO1xuICAgICAgICBjb25zdCBjYW5GaXggPSBuYW1lc3BhY2VJZGVudGlmaWVycy5sZW5ndGggPiAwICYmICF1c2VzTmFtZXNwYWNlQXNPYmplY3QobmFtZXNwYWNlSWRlbnRpZmllcnMpO1xuXG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGBVbmV4cGVjdGVkIG5hbWVzcGFjZSBpbXBvcnQuYCxcbiAgICAgICAgICBmaXg6IGNhbkZpeCAmJiAoZml4ZXIgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2NvcGVNYW5hZ2VyID0gY29udGV4dC5nZXRTb3VyY2VDb2RlKCkuc2NvcGVNYW5hZ2VyO1xuICAgICAgICAgICAgY29uc3QgZml4ZXMgPSBbXTtcblxuICAgICAgICAgICAgLy8gUGFzcyAxOiBDb2xsZWN0IHZhcmlhYmxlIG5hbWVzIHRoYXQgYXJlIGFscmVhZHkgaW4gc2NvcGUgZm9yIGVhY2ggcmVmZXJlbmNlIHdlIHdhbnRcbiAgICAgICAgICAgIC8vIHRvIHRyYW5zZm9ybSwgc28gdGhhdCB3ZSBjYW4gYmUgc3VyZSB0aGF0IHdlIGNob29zZSBub24tY29uZmxpY3RpbmcgaW1wb3J0IG5hbWVzXG4gICAgICAgICAgICBjb25zdCBpbXBvcnROYW1lQ29uZmxpY3RzID0ge307XG4gICAgICAgICAgICBuYW1lc3BhY2VJZGVudGlmaWVycy5mb3JFYWNoKChpZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IGlkZW50aWZpZXIucGFyZW50O1xuICAgICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnROYW1lID0gZ2V0TWVtYmVyUHJvcGVydHlOYW1lKHBhcmVudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9jYWxDb25mbGljdHMgPSBnZXRWYXJpYWJsZU5hbWVzSW5TY29wZShzY29wZU1hbmFnZXIsIHBhcmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpbXBvcnROYW1lQ29uZmxpY3RzW2ltcG9ydE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICBpbXBvcnROYW1lQ29uZmxpY3RzW2ltcG9ydE5hbWVdID0gbG9jYWxDb25mbGljdHM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxvY2FsQ29uZmxpY3RzLmZvckVhY2goKGMpID0+IGltcG9ydE5hbWVDb25mbGljdHNbaW1wb3J0TmFtZV0uYWRkKGMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBDaG9vc2UgbmV3IG5hbWVzIGZvciBlYWNoIGltcG9ydFxuICAgICAgICAgICAgY29uc3QgaW1wb3J0TmFtZXMgPSBPYmplY3Qua2V5cyhpbXBvcnROYW1lQ29uZmxpY3RzKTtcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydExvY2FsTmFtZXMgPSBnZW5lcmF0ZUxvY2FsTmFtZXMoXG4gICAgICAgICAgICAgIGltcG9ydE5hbWVzLFxuICAgICAgICAgICAgICBpbXBvcnROYW1lQ29uZmxpY3RzLFxuICAgICAgICAgICAgICBuYW1lc3BhY2VWYXJpYWJsZS5uYW1lXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgd2l0aCBhIGxpc3Qgb2YgSW1wb3J0U3BlY2lmaWVyc1xuICAgICAgICAgICAgY29uc3QgbmFtZWRJbXBvcnRTcGVjaWZpZXJzID0gaW1wb3J0TmFtZXMubWFwKChpbXBvcnROYW1lKSA9PiAoXG4gICAgICAgICAgICAgIGltcG9ydE5hbWUgPT09IGltcG9ydExvY2FsTmFtZXNbaW1wb3J0TmFtZV1cbiAgICAgICAgICAgICAgICA/IGltcG9ydE5hbWVcbiAgICAgICAgICAgICAgICA6IGAke2ltcG9ydE5hbWV9IGFzICR7aW1wb3J0TG9jYWxOYW1lc1tpbXBvcnROYW1lXX1gXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIGZpeGVzLnB1c2goZml4ZXIucmVwbGFjZVRleHQobm9kZSwgYHsgJHtuYW1lZEltcG9ydFNwZWNpZmllcnMuam9pbignLCAnKX0gfWApKTtcblxuICAgICAgICAgICAgLy8gUGFzcyAyOiBSZXBsYWNlIHJlZmVyZW5jZXMgdG8gdGhlIG5hbWVzcGFjZSB3aXRoIHJlZmVyZW5jZXMgdG8gdGhlIG5hbWVkIGltcG9ydHNcbiAgICAgICAgICAgIG5hbWVzcGFjZUlkZW50aWZpZXJzLmZvckVhY2goKGlkZW50aWZpZXIpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gaWRlbnRpZmllci5wYXJlbnQ7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGltcG9ydE5hbWUgPSBnZXRNZW1iZXJQcm9wZXJ0eU5hbWUocGFyZW50KTtcbiAgICAgICAgICAgICAgICBmaXhlcy5wdXNoKGZpeGVyLnJlcGxhY2VUZXh0KHBhcmVudCwgaW1wb3J0TG9jYWxOYW1lc1tpbXBvcnROYW1lXSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZpeGVzO1xuICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfSxcbn07XG5cbi8qKlxuICogQHBhcmFtIHtJZGVudGlmaWVyW119IG5hbWVzcGFjZUlkZW50aWZpZXJzXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYHRydWVgIGlmIHRoZSBuYW1lc3BhY2UgdmFyaWFibGUgaXMgbW9yZSB0aGFuIGp1c3QgYSBnbG9yaWZpZWQgY29uc3RhbnRcbiAqL1xuZnVuY3Rpb24gdXNlc05hbWVzcGFjZUFzT2JqZWN0KG5hbWVzcGFjZUlkZW50aWZpZXJzKSB7XG4gIHJldHVybiAhbmFtZXNwYWNlSWRlbnRpZmllcnMuZXZlcnkoKGlkZW50aWZpZXIpID0+IHtcbiAgICBjb25zdCBwYXJlbnQgPSBpZGVudGlmaWVyLnBhcmVudDtcblxuICAgIC8vIGBuYW1lc3BhY2UueGAgb3IgYG5hbWVzcGFjZVsneCddYFxuICAgIHJldHVybiAoXG4gICAgICBwYXJlbnQgJiYgcGFyZW50LnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJyAmJlxuICAgICAgKHBhcmVudC5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcicgfHwgcGFyZW50LnByb3BlcnR5LnR5cGUgPT09ICdMaXRlcmFsJylcbiAgICApO1xuICB9KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge01lbWJlckV4cHJlc3Npb259IG1lbWJlckV4cHJlc3Npb25cbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSBtZW1iZXIgaW4gdGhlIG9iamVjdCBleHByZXNzaW9uLCBlLmcuIHRoZSBgeGAgaW4gYG5hbWVzcGFjZS54YFxuICovXG5mdW5jdGlvbiBnZXRNZW1iZXJQcm9wZXJ0eU5hbWUobWVtYmVyRXhwcmVzc2lvbikge1xuICByZXR1cm4gbWVtYmVyRXhwcmVzc2lvbi5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcidcbiAgICA/IG1lbWJlckV4cHJlc3Npb24ucHJvcGVydHkubmFtZVxuICAgIDogbWVtYmVyRXhwcmVzc2lvbi5wcm9wZXJ0eS52YWx1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1Njb3BlTWFuYWdlcn0gc2NvcGVNYW5hZ2VyXG4gKiBAcGFyYW0ge0FTVE5vZGV9IG5vZGVcbiAqIEByZXR1cm4ge1NldDxzdHJpbmc+fVxuICovXG5mdW5jdGlvbiBnZXRWYXJpYWJsZU5hbWVzSW5TY29wZShzY29wZU1hbmFnZXIsIG5vZGUpIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgbGV0IHNjb3BlID0gc2NvcGVNYW5hZ2VyLmFjcXVpcmUoY3VycmVudE5vZGUpO1xuICB3aGlsZSAoc2NvcGUgPT0gbnVsbCkge1xuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUucGFyZW50O1xuICAgIHNjb3BlID0gc2NvcGVNYW5hZ2VyLmFjcXVpcmUoY3VycmVudE5vZGUsIHRydWUpO1xuICB9XG4gIHJldHVybiBuZXcgU2V0KFtcbiAgICAuLi5zY29wZS52YXJpYWJsZXMubWFwKHZhcmlhYmxlID0+IHZhcmlhYmxlLm5hbWUpLFxuICAgIC4uLnNjb3BlLnVwcGVyLnZhcmlhYmxlcy5tYXAodmFyaWFibGUgPT4gdmFyaWFibGUubmFtZSksXG4gIF0pO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0geyp9IG5hbWVzXG4gKiBAcGFyYW0geyp9IG5hbWVDb25mbGljdHNcbiAqIEBwYXJhbSB7Kn0gbmFtZXNwYWNlTmFtZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUxvY2FsTmFtZXMobmFtZXMsIG5hbWVDb25mbGljdHMsIG5hbWVzcGFjZU5hbWUpIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHt9O1xuICBuYW1lcy5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgbGV0IGxvY2FsTmFtZTtcbiAgICBpZiAoIW5hbWVDb25mbGljdHNbbmFtZV0uaGFzKG5hbWUpKSB7XG4gICAgICBsb2NhbE5hbWUgPSBuYW1lO1xuICAgIH0gZWxzZSBpZiAoIW5hbWVDb25mbGljdHNbbmFtZV0uaGFzKGAke25hbWVzcGFjZU5hbWV9XyR7bmFtZX1gKSkge1xuICAgICAgbG9jYWxOYW1lID0gYCR7bmFtZXNwYWNlTmFtZX1fJHtuYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgSW5maW5pdHk7IGkrKykge1xuICAgICAgICBpZiAoIW5hbWVDb25mbGljdHNbbmFtZV0uaGFzKGAke25hbWVzcGFjZU5hbWV9XyR7bmFtZX1fJHtpfWApKSB7XG4gICAgICAgICAgbG9jYWxOYW1lID0gYCR7bmFtZXNwYWNlTmFtZX1fJHtuYW1lfV8ke2l9YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBsb2NhbE5hbWVzW25hbWVdID0gbG9jYWxOYW1lO1xuICB9KTtcbiAgcmV0dXJuIGxvY2FsTmFtZXM7XG59XG4iXX0=