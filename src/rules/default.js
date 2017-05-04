import Exports from '../ExportMap'

module.exports = {
  meta: {
    docs: {},
  },

  create: function (context) {

    function checkDefault(specifierType, node) {

      // poor man's Array.find
      let defaultSpecifier
      node.specifiers.some((n) => {
        if (n.type === specifierType) {
          defaultSpecifier = n
          return true
        }
      })

      if (!defaultSpecifier) return
      var imports = Exports.get(node.source.value, context)
      if (imports == null) return

      if (imports.errors.length) {
        imports.reportErrors(context, node)
      } else if (imports.get('default') === undefined) {
        context.report(defaultSpecifier, 'No default export found in module.')
      }
    }

    return {
      'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
      'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier'),
      CallExpression: function (node) {
        // verify `require()` with one argument
        if (node.callee.name !== 'require' || node.arguments.length !== 1) return

        // verify require path must be a string with a value
        if (node.arguments[0].type !== 'Literal' || !node.arguments[0].value) return
        var srcPath = node.arguments[0].value

        // get import source from path
        var imports = Exports.get(srcPath, context)
        if (!imports) return

        // report parse errors for imported file
        if (imports.errors.length) {
          return context.report({
            message: imports.errorsToString(srcPath),
            node,
          })
        }

        var exportHasDefault = imports.get('default')
        var requireHasDefault = node.parent.type === 'MemberExpression'
          && node.parent.property.name === 'default'

        if (exportHasDefault && !requireHasDefault) {
          context.report({
            message: 'requiring ES module must reference default',
            node,
          })
        } else if (requireHasDefault && !exportHasDefault) {
          context.report({
            message: 'No default export found in module.',
            node,
          })
        }
      },
    }
  },
}
