'use strict';var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2['default'])('default') },

    schema: [] },


  create: function () {function create(context) {

      function checkDefault(specifierType, node) {

        var defaultSpecifier = node.specifiers.find(
        function (specifier) {return specifier.type === specifierType;});


        if (!defaultSpecifier) return;
        var imports = _ExportMap2['default'].get(node.source.value, context);
        if (imports == null) return;

        if (imports.errors.length) {
          imports.reportErrors(context, node);
        } else if (imports.get('default') === undefined) {
          context.report({
            node: defaultSpecifier,
            message: 'No default export found in imported module "' + String(node.source.value) + '".' });

        }
      }

      return {
        'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
        'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier') };

    }return create;}() };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tEZWZhdWx0Iiwic3BlY2lmaWVyVHlwZSIsIm5vZGUiLCJkZWZhdWx0U3BlY2lmaWVyIiwic3BlY2lmaWVycyIsImZpbmQiLCJzcGVjaWZpZXIiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwidW5kZWZpbmVkIiwicmVwb3J0IiwibWVzc2FnZSIsImJpbmQiXSwibWFwcGluZ3MiOiJhQUFBLHlDO0FBQ0EscUM7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLDBCQUFRLFNBQVIsQ0FERCxFQUZGOztBQUtKQyxZQUFRLEVBTEosRUFEUzs7O0FBU2ZDLFFBVGUsK0JBU1JDLE9BVFEsRUFTQzs7QUFFZCxlQUFTQyxZQUFULENBQXNCQyxhQUF0QixFQUFxQ0MsSUFBckMsRUFBMkM7O0FBRXpDLFlBQU1DLG1CQUFtQkQsS0FBS0UsVUFBTCxDQUFnQkMsSUFBaEI7QUFDdkIscUNBQWFDLFVBQVVaLElBQVYsS0FBbUJPLGFBQWhDLEVBRHVCLENBQXpCOzs7QUFJQSxZQUFJLENBQUNFLGdCQUFMLEVBQXVCO0FBQ3ZCLFlBQU1JLFVBQVVDLHVCQUFRQyxHQUFSLENBQVlQLEtBQUtRLE1BQUwsQ0FBWUMsS0FBeEIsRUFBK0JaLE9BQS9CLENBQWhCO0FBQ0EsWUFBSVEsV0FBVyxJQUFmLEVBQXFCOztBQUVyQixZQUFJQSxRQUFRSyxNQUFSLENBQWVDLE1BQW5CLEVBQTJCO0FBQ3pCTixrQkFBUU8sWUFBUixDQUFxQmYsT0FBckIsRUFBOEJHLElBQTlCO0FBQ0QsU0FGRCxNQUVPLElBQUlLLFFBQVFFLEdBQVIsQ0FBWSxTQUFaLE1BQTJCTSxTQUEvQixFQUEwQztBQUMvQ2hCLGtCQUFRaUIsTUFBUixDQUFlO0FBQ2JkLGtCQUFNQyxnQkFETztBQUViYyw2RUFBd0RmLEtBQUtRLE1BQUwsQ0FBWUMsS0FBcEUsUUFGYSxFQUFmOztBQUlEO0FBQ0Y7O0FBRUQsYUFBTztBQUNMLDZCQUFxQlgsYUFBYWtCLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0Isd0JBQXhCLENBRGhCO0FBRUwsa0NBQTBCbEIsYUFBYWtCLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0Isd0JBQXhCLENBRnJCLEVBQVA7O0FBSUQsS0FuQ2MsbUJBQWpCIiwiZmlsZSI6ImRlZmF1bHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnZGVmYXVsdCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXSxcbiAgfSxcblxuICBjcmVhdGUoY29udGV4dCkge1xuXG4gICAgZnVuY3Rpb24gY2hlY2tEZWZhdWx0KHNwZWNpZmllclR5cGUsIG5vZGUpIHtcblxuICAgICAgY29uc3QgZGVmYXVsdFNwZWNpZmllciA9IG5vZGUuc3BlY2lmaWVycy5maW5kKFxuICAgICAgICBzcGVjaWZpZXIgPT4gc3BlY2lmaWVyLnR5cGUgPT09IHNwZWNpZmllclR5cGVcbiAgICAgICk7XG5cbiAgICAgIGlmICghZGVmYXVsdFNwZWNpZmllcikgcmV0dXJuO1xuICAgICAgY29uc3QgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0KTtcbiAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVybjtcblxuICAgICAgaWYgKGltcG9ydHMuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBpbXBvcnRzLnJlcG9ydEVycm9ycyhjb250ZXh0LCBub2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoaW1wb3J0cy5nZXQoJ2RlZmF1bHQnKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlOiBkZWZhdWx0U3BlY2lmaWVyLFxuICAgICAgICAgIG1lc3NhZ2U6IGBObyBkZWZhdWx0IGV4cG9ydCBmb3VuZCBpbiBpbXBvcnRlZCBtb2R1bGUgXCIke25vZGUuc291cmNlLnZhbHVlfVwiLmAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAnSW1wb3J0RGVjbGFyYXRpb24nOiBjaGVja0RlZmF1bHQuYmluZChudWxsLCAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcicpLFxuICAgICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBjaGVja0RlZmF1bHQuYmluZChudWxsLCAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcicpLFxuICAgIH07XG4gIH0sXG59O1xuIl19