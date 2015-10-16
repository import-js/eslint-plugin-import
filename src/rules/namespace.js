import { get as getExports } from '../core/getExports'
import importDeclaration from '../importDeclaration'

export default function (context) {

  const namespaces = new Map()

  function getImportsAndReport(namespace) {
    var declaration = importDeclaration(context)

    var imports = getExports(declaration.source.value, context)
    if (imports == null) return null

    if (!imports.hasNamed) {
      context.report(namespace,
        `No exported names found in module '${declaration.source.value}'.`)
    }

    return imports
  }

  return {
    'ImportNamespaceSpecifier': function (namespace) {
      const imports = getImportsAndReport(namespace)
      if (imports == null) return
      namespaces.set(namespace.local.name, imports.named)
    },

    // same as above, but does not add names to local map
    'ExportNamespaceSpecifier': function (namespace) {
      getImportsAndReport(namespace)
    },

    // todo: check for possible redefinition

    'MemberExpression': function (dereference) {
      if (dereference.object.type !== 'Identifier') return
      if (!namespaces.has(dereference.object.name)) return

      if (dereference.parent.type === 'AssignmentExpression' &&
          dereference.parent.left === dereference) {
          context.report(dereference.parent,
              `Assignment to member of namespace '${dereference.object.name}'.`)
      }

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
