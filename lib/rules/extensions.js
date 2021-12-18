'use strict';var _path = require('path');var _path2 = _interopRequireDefault(_path);

var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);
var _importType = require('../core/importType');
var _moduleVisitor = require('eslint-module-utils/moduleVisitor');var _moduleVisitor2 = _interopRequireDefault(_moduleVisitor);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}

var enumValues = { 'enum': ['always', 'ignorePackages', 'never'] };
var patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues } };

var properties = {
  type: 'object',
  properties: {
    'pattern': patternProperties,
    'ignorePackages': { type: 'boolean' } } };



function buildProperties(context) {

  var result = {
    defaultConfig: 'never',
    pattern: {},
    ignorePackages: false };


  context.options.forEach(function (obj) {

    // If this is a string, set defaultConfig to its value
    if (typeof obj === 'string') {
      result.defaultConfig = obj;
      return;
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (obj.pattern === undefined && obj.ignorePackages === undefined) {
      Object.assign(result.pattern, obj);
      return;
    }

    // If pattern is provided, transfer all props
    if (obj.pattern !== undefined) {
      Object.assign(result.pattern, obj.pattern);
    }

    // If ignorePackages is provided, transfer it to result
    if (obj.ignorePackages !== undefined) {
      result.ignorePackages = obj.ignorePackages;
    }
  });

  if (result.defaultConfig === 'ignorePackages') {
    result.defaultConfig = 'always';
    result.ignorePackages = true;
  }

  return result;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2['default'])('extensions') },


    schema: {
      anyOf: [
      {
        type: 'array',
        items: [enumValues],
        additionalItems: false },

      {
        type: 'array',
        items: [
        enumValues,
        properties],

        additionalItems: false },

      {
        type: 'array',
        items: [properties],
        additionalItems: false },

      {
        type: 'array',
        items: [patternProperties],
        additionalItems: false },

      {
        type: 'array',
        items: [
        enumValues,
        patternProperties],

        additionalItems: false }] } },





  create: function () {function create(context) {

      var props = buildProperties(context);

      function getModifier(extension) {
        return props.pattern[extension] || props.defaultConfig;
      }

      function isUseOfExtensionRequired(extension, isPackage) {
        return getModifier(extension) === 'always' && (!props.ignorePackages || !isPackage);
      }

      function isUseOfExtensionForbidden(extension) {
        return getModifier(extension) === 'never';
      }

      function isResolvableWithoutExtension(file) {
        var extension = _path2['default'].extname(file);
        var fileWithoutExtension = file.slice(0, -extension.length);
        var resolvedFileWithoutExtension = (0, _resolve2['default'])(fileWithoutExtension, context);

        return resolvedFileWithoutExtension === (0, _resolve2['default'])(file, context);
      }

      function isExternalRootModule(file) {
        var slashCount = file.split('/').length - 1;

        if (slashCount === 0) return true;
        if ((0, _importType.isScopedModule)(file) && slashCount <= 1) return true;
        return false;
      }

      function checkFileExtension(source, node) {
        // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
        if (!source || !source.value) return;

        var importPathWithQueryString = source.value;

        // don't enforce anything on builtins
        if ((0, _importType.isBuiltIn)(importPathWithQueryString, context.settings)) return;

        var importPath = importPathWithQueryString.replace(/\?(.*)$/, '');

        // don't enforce in root external packages as they may have names with `.js`.
        // Like `import Decimal from decimal.js`)
        if (isExternalRootModule(importPath)) return;

        var resolvedPath = (0, _resolve2['default'])(importPath, context);

        // get extension from resolved path, if possible.
        // for unresolved, use source value.
        var extension = _path2['default'].extname(resolvedPath || importPath).substring(1);

        // determine if this is a module
        var isPackage = (0, _importType.isExternalModule)(
        importPath,
        context.settings,
        (0, _resolve2['default'])(importPath, context),
        context) ||
        (0, _importType.isScoped)(importPath);

        if (!extension || !importPath.endsWith('.' + String(extension))) {
          // ignore type-only imports
          if (node.importKind === 'type') return;
          var extensionRequired = isUseOfExtensionRequired(extension, isPackage);
          var extensionForbidden = isUseOfExtensionForbidden(extension);
          if (extensionRequired && !extensionForbidden) {
            context.report({
              node: source,
              message: 'Missing file extension ' + (
              extension ? '"' + String(extension) + '" ' : '') + 'for "' + String(importPathWithQueryString) + '"' });

          }
        } else if (extension) {
          if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
            context.report({
              node: source,
              message: 'Unexpected use of file extension "' + String(extension) + '" for "' + String(importPathWithQueryString) + '"' });

          }
        }
      }

      return (0, _moduleVisitor2['default'])(checkFileExtension, { commonjs: true });
    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHRlbnNpb25zLmpzIl0sIm5hbWVzIjpbImVudW1WYWx1ZXMiLCJwYXR0ZXJuUHJvcGVydGllcyIsInR5cGUiLCJwcm9wZXJ0aWVzIiwiYnVpbGRQcm9wZXJ0aWVzIiwiY29udGV4dCIsInJlc3VsdCIsImRlZmF1bHRDb25maWciLCJwYXR0ZXJuIiwiaWdub3JlUGFja2FnZXMiLCJvcHRpb25zIiwiZm9yRWFjaCIsIm9iaiIsInVuZGVmaW5lZCIsIk9iamVjdCIsImFzc2lnbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImFueU9mIiwiaXRlbXMiLCJhZGRpdGlvbmFsSXRlbXMiLCJjcmVhdGUiLCJwcm9wcyIsImdldE1vZGlmaWVyIiwiZXh0ZW5zaW9uIiwiaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkIiwiaXNQYWNrYWdlIiwiaXNVc2VPZkV4dGVuc2lvbkZvcmJpZGRlbiIsImlzUmVzb2x2YWJsZVdpdGhvdXRFeHRlbnNpb24iLCJmaWxlIiwicGF0aCIsImV4dG5hbWUiLCJmaWxlV2l0aG91dEV4dGVuc2lvbiIsInNsaWNlIiwibGVuZ3RoIiwicmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiIsImlzRXh0ZXJuYWxSb290TW9kdWxlIiwic2xhc2hDb3VudCIsInNwbGl0IiwiY2hlY2tGaWxlRXh0ZW5zaW9uIiwic291cmNlIiwibm9kZSIsInZhbHVlIiwiaW1wb3J0UGF0aFdpdGhRdWVyeVN0cmluZyIsInNldHRpbmdzIiwiaW1wb3J0UGF0aCIsInJlcGxhY2UiLCJyZXNvbHZlZFBhdGgiLCJzdWJzdHJpbmciLCJlbmRzV2l0aCIsImltcG9ydEtpbmQiLCJleHRlbnNpb25SZXF1aXJlZCIsImV4dGVuc2lvbkZvcmJpZGRlbiIsInJlcG9ydCIsIm1lc3NhZ2UiLCJjb21tb25qcyJdLCJtYXBwaW5ncyI6ImFBQUEsNEI7O0FBRUEsc0Q7QUFDQTtBQUNBLGtFO0FBQ0EscUM7O0FB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QUNELEtBaEljLG1CQUFqQiIsImZpbGUiOiJleHRlbnNpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSc7XG5pbXBvcnQgeyBpc0J1aWx0SW4sIGlzRXh0ZXJuYWxNb2R1bGUsIGlzU2NvcGVkLCBpc1Njb3BlZE1vZHVsZSB9IGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSc7XG5pbXBvcnQgbW9kdWxlVmlzaXRvciBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL21vZHVsZVZpc2l0b3InO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmNvbnN0IGVudW1WYWx1ZXMgPSB7IGVudW06IFsgJ2Fsd2F5cycsICdpZ25vcmVQYWNrYWdlcycsICduZXZlcicgXSB9O1xuY29uc3QgcGF0dGVyblByb3BlcnRpZXMgPSB7XG4gIHR5cGU6ICdvYmplY3QnLFxuICBwYXR0ZXJuUHJvcGVydGllczogeyAnLionOiBlbnVtVmFsdWVzIH0sXG59O1xuY29uc3QgcHJvcGVydGllcyA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHByb3BlcnRpZXM6IHtcbiAgICAncGF0dGVybic6IHBhdHRlcm5Qcm9wZXJ0aWVzLFxuICAgICdpZ25vcmVQYWNrYWdlcyc6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gIH0sXG59O1xuXG5mdW5jdGlvbiBidWlsZFByb3BlcnRpZXMoY29udGV4dCkge1xuXG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBkZWZhdWx0Q29uZmlnOiAnbmV2ZXInLFxuICAgIHBhdHRlcm46IHt9LFxuICAgIGlnbm9yZVBhY2thZ2VzOiBmYWxzZSxcbiAgfTtcblxuICBjb250ZXh0Lm9wdGlvbnMuZm9yRWFjaChvYmogPT4ge1xuXG4gICAgLy8gSWYgdGhpcyBpcyBhIHN0cmluZywgc2V0IGRlZmF1bHRDb25maWcgdG8gaXRzIHZhbHVlXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXN1bHQuZGVmYXVsdENvbmZpZyA9IG9iajtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgbmV3IHN0cnVjdHVyZSwgdHJhbnNmZXIgYWxsIHByb3BzIHRvIHJlc3VsdC5wYXR0ZXJuXG4gICAgaWYgKG9iai5wYXR0ZXJuID09PSB1bmRlZmluZWQgJiYgb2JqLmlnbm9yZVBhY2thZ2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24ocmVzdWx0LnBhdHRlcm4sIG9iaik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgcGF0dGVybiBpcyBwcm92aWRlZCwgdHJhbnNmZXIgYWxsIHByb3BzXG4gICAgaWYgKG9iai5wYXR0ZXJuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24ocmVzdWx0LnBhdHRlcm4sIG9iai5wYXR0ZXJuKTtcbiAgICB9XG5cbiAgICAvLyBJZiBpZ25vcmVQYWNrYWdlcyBpcyBwcm92aWRlZCwgdHJhbnNmZXIgaXQgdG8gcmVzdWx0XG4gICAgaWYgKG9iai5pZ25vcmVQYWNrYWdlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXN1bHQuaWdub3JlUGFja2FnZXMgPSBvYmouaWdub3JlUGFja2FnZXM7XG4gICAgfVxuICB9KTtcblxuICBpZiAocmVzdWx0LmRlZmF1bHRDb25maWcgPT09ICdpZ25vcmVQYWNrYWdlcycpIHtcbiAgICByZXN1bHQuZGVmYXVsdENvbmZpZyA9ICdhbHdheXMnO1xuICAgIHJlc3VsdC5pZ25vcmVQYWNrYWdlcyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2V4dGVuc2lvbnMnKSxcbiAgICB9LFxuXG4gICAgc2NoZW1hOiB7XG4gICAgICBhbnlPZjogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBpdGVtczogW2VudW1WYWx1ZXNdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICBlbnVtVmFsdWVzLFxuICAgICAgICAgICAgcHJvcGVydGllcyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbcHJvcGVydGllc10sXG4gICAgICAgICAgYWRkaXRpb25hbEl0ZW1zOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtwYXR0ZXJuUHJvcGVydGllc10sXG4gICAgICAgICAgYWRkaXRpb25hbEl0ZW1zOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIGVudW1WYWx1ZXMsXG4gICAgICAgICAgICBwYXR0ZXJuUHJvcGVydGllcyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlKGNvbnRleHQpIHtcblxuICAgIGNvbnN0IHByb3BzID0gYnVpbGRQcm9wZXJ0aWVzKGNvbnRleHQpO1xuXG4gICAgZnVuY3Rpb24gZ2V0TW9kaWZpZXIoZXh0ZW5zaW9uKSB7XG4gICAgICByZXR1cm4gcHJvcHMucGF0dGVybltleHRlbnNpb25dIHx8IHByb3BzLmRlZmF1bHRDb25maWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkKGV4dGVuc2lvbiwgaXNQYWNrYWdlKSB7XG4gICAgICByZXR1cm4gZ2V0TW9kaWZpZXIoZXh0ZW5zaW9uKSA9PT0gJ2Fsd2F5cycgJiYgKCFwcm9wcy5pZ25vcmVQYWNrYWdlcyB8fCAhaXNQYWNrYWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuKGV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIGdldE1vZGlmaWVyKGV4dGVuc2lvbikgPT09ICduZXZlcic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNSZXNvbHZhYmxlV2l0aG91dEV4dGVuc2lvbihmaWxlKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZSk7XG4gICAgICBjb25zdCBmaWxlV2l0aG91dEV4dGVuc2lvbiA9IGZpbGUuc2xpY2UoMCwgLWV4dGVuc2lvbi5sZW5ndGgpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9IHJlc29sdmUoZmlsZVdpdGhvdXRFeHRlbnNpb24sIGNvbnRleHQpO1xuXG4gICAgICByZXR1cm4gcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9PT0gcmVzb2x2ZShmaWxlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0V4dGVybmFsUm9vdE1vZHVsZShmaWxlKSB7XG4gICAgICBjb25zdCBzbGFzaENvdW50ID0gZmlsZS5zcGxpdCgnLycpLmxlbmd0aCAtIDE7XG5cbiAgICAgIGlmIChzbGFzaENvdW50ID09PSAwKSAgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoaXNTY29wZWRNb2R1bGUoZmlsZSkgJiYgc2xhc2hDb3VudCA8PSAxKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0ZpbGVFeHRlbnNpb24oc291cmNlLCBub2RlKSB7XG4gICAgICAvLyBiYWlsIGlmIHRoZSBkZWNsYXJhdGlvbiBkb2Vzbid0IGhhdmUgYSBzb3VyY2UsIGUuZy4gXCJleHBvcnQgeyBmb28gfTtcIiwgb3IgaWYgaXQncyBvbmx5IHBhcnRpYWxseSB0eXBlZCBsaWtlIGluIGFuIGVkaXRvclxuICAgICAgaWYgKCFzb3VyY2UgfHwgIXNvdXJjZS52YWx1ZSkgcmV0dXJuO1xuICAgICAgXG4gICAgICBjb25zdCBpbXBvcnRQYXRoV2l0aFF1ZXJ5U3RyaW5nID0gc291cmNlLnZhbHVlO1xuXG4gICAgICAvLyBkb24ndCBlbmZvcmNlIGFueXRoaW5nIG9uIGJ1aWx0aW5zXG4gICAgICBpZiAoaXNCdWlsdEluKGltcG9ydFBhdGhXaXRoUXVlcnlTdHJpbmcsIGNvbnRleHQuc2V0dGluZ3MpKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGltcG9ydFBhdGggPSBpbXBvcnRQYXRoV2l0aFF1ZXJ5U3RyaW5nLnJlcGxhY2UoL1xcPyguKikkLywgJycpO1xuXG4gICAgICAvLyBkb24ndCBlbmZvcmNlIGluIHJvb3QgZXh0ZXJuYWwgcGFja2FnZXMgYXMgdGhleSBtYXkgaGF2ZSBuYW1lcyB3aXRoIGAuanNgLlxuICAgICAgLy8gTGlrZSBgaW1wb3J0IERlY2ltYWwgZnJvbSBkZWNpbWFsLmpzYClcbiAgICAgIGlmIChpc0V4dGVybmFsUm9vdE1vZHVsZShpbXBvcnRQYXRoKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKGltcG9ydFBhdGgsIGNvbnRleHQpO1xuXG4gICAgICAvLyBnZXQgZXh0ZW5zaW9uIGZyb20gcmVzb2x2ZWQgcGF0aCwgaWYgcG9zc2libGUuXG4gICAgICAvLyBmb3IgdW5yZXNvbHZlZCwgdXNlIHNvdXJjZSB2YWx1ZS5cbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZShyZXNvbHZlZFBhdGggfHwgaW1wb3J0UGF0aCkuc3Vic3RyaW5nKDEpO1xuXG4gICAgICAvLyBkZXRlcm1pbmUgaWYgdGhpcyBpcyBhIG1vZHVsZVxuICAgICAgY29uc3QgaXNQYWNrYWdlID0gaXNFeHRlcm5hbE1vZHVsZShcbiAgICAgICAgaW1wb3J0UGF0aCxcbiAgICAgICAgY29udGV4dC5zZXR0aW5ncyxcbiAgICAgICAgcmVzb2x2ZShpbXBvcnRQYXRoLCBjb250ZXh0KSxcbiAgICAgICAgY29udGV4dFxuICAgICAgKSB8fCBpc1Njb3BlZChpbXBvcnRQYXRoKTtcblxuICAgICAgaWYgKCFleHRlbnNpb24gfHwgIWltcG9ydFBhdGguZW5kc1dpdGgoYC4ke2V4dGVuc2lvbn1gKSkge1xuICAgICAgICAvLyBpZ25vcmUgdHlwZS1vbmx5IGltcG9ydHNcbiAgICAgICAgaWYgKG5vZGUuaW1wb3J0S2luZCA9PT0gJ3R5cGUnKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGV4dGVuc2lvblJlcXVpcmVkID0gaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkKGV4dGVuc2lvbiwgaXNQYWNrYWdlKTtcbiAgICAgICAgY29uc3QgZXh0ZW5zaW9uRm9yYmlkZGVuID0gaXNVc2VPZkV4dGVuc2lvbkZvcmJpZGRlbihleHRlbnNpb24pO1xuICAgICAgICBpZiAoZXh0ZW5zaW9uUmVxdWlyZWQgJiYgIWV4dGVuc2lvbkZvcmJpZGRlbikge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgIGBNaXNzaW5nIGZpbGUgZXh0ZW5zaW9uICR7ZXh0ZW5zaW9uID8gYFwiJHtleHRlbnNpb259XCIgYCA6ICcnfWZvciBcIiR7aW1wb3J0UGF0aFdpdGhRdWVyeVN0cmluZ31cImAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZXh0ZW5zaW9uKSB7XG4gICAgICAgIGlmIChpc1VzZU9mRXh0ZW5zaW9uRm9yYmlkZGVuKGV4dGVuc2lvbikgJiYgaXNSZXNvbHZhYmxlV2l0aG91dEV4dGVuc2lvbihpbXBvcnRQYXRoKSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBVbmV4cGVjdGVkIHVzZSBvZiBmaWxlIGV4dGVuc2lvbiBcIiR7ZXh0ZW5zaW9ufVwiIGZvciBcIiR7aW1wb3J0UGF0aFdpdGhRdWVyeVN0cmluZ31cImAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlVmlzaXRvcihjaGVja0ZpbGVFeHRlbnNpb24sIHsgY29tbW9uanM6IHRydWUgfSk7XG4gIH0sXG59O1xuIl19