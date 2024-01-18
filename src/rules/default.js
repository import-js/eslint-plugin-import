import Exports from '../ExportMap'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Static analysis',
      description:
        'Ensure a default export is present, given a default import.',
      url: docsUrl('default'),
    },
    schema: [],
  },

  create(context) {
    function checkDefault(specifierType, node) {
      const defaultSpecifier = node.specifiers.find(
        specifier => specifier.type === specifierType,
      )

      if (!defaultSpecifier) {
        return
      }
      const imports = Exports.get(node.source.value, context)
      if (imports == null) {
        return
      }

      if (imports.errors.length) {
        imports.reportErrors(context, node)
      } else if (imports.get('default') === undefined) {
        context.report({
          node: defaultSpecifier,
          message: `No default export found in imported module "${node.source.value}".`,
        })
      }
    }

    return {
      ImportDeclaration: checkDefault.bind(null, 'ImportDefaultSpecifier'),
      ExportNamedDeclaration: checkDefault.bind(null, 'ExportDefaultSpecifier'),
    }
  },
}
