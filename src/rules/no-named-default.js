import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {
    function checkDefault(nameKey, defaultSpecifier) {
      return;
    }
    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local'),
    }
  },
}
