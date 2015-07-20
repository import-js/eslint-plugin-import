'use strict'

var Map = require('es6-map')
  , getExports = require('../core/getExports').get
  , importDeclaration = require('../importDeclaration')

module.exports = function (context) {

  var namespaces = new Map()

  return {
    'ImportNamespaceSpecifier': function (namespace) {

      var declaration = importDeclaration(context)

      var imports = getExports(declaration.source.value, context)
      if (imports == null) return

      if (imports.named.size === 0) {
        context.report(namespace,
          'No exported names found in module \'' +
          declaration.source.value + '\'.')
      }

      namespaces.set(namespace.local.name, imports.named)
    },

    // todo: check for possible redefinition

    'MemberExpression': function (dereference) {
      if (dereference.object.type !== 'Identifier') return
      if (!namespaces.has(dereference.object.name)) return

      if (dereference.computed) {
        context.report(dereference.property,
          'Unable to validate computed reference to imported namespace \'' +
          dereference.object.name + '\'.')
        return
      }

      var namespace = namespaces.get(dereference.object.name)
      if (!namespace.has(dereference.property.name)) {
        context.report(dereference.property,
        '\'' + dereference.property.name +
        '\' not found in imported namespace ' +
        dereference.object.name + '.')
      }
    }
  }
}
