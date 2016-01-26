import Exports from '../core/getExports'
import importDeclaration from '../importDeclaration'

module.exports = function (context) {

  const namespaces = new Map()

  function getImportsAndReport(namespace) {
    var declaration = importDeclaration(context)

    var imports = Exports.get(declaration.source.value, context)
    if (imports == null) return null

    if (imports.errors.length) {
      context.report({
        node: declaration.source,
        message: `Parse errors in imported module '${declaration.source.value}'.`,
      })
      return
    }

    if (!imports.hasNamed) {
      context.report(namespace,
        `No exported names found in module '${declaration.source.value}'.`)
    }

    return imports
  }

  function makeMessage(last, namepath) {
     return `'${last.name}' not found in` +
            (namepath.length > 1 ? ' deeply ' : ' ') +
            `imported namespace '${namepath.join('.')}'.`
  }

  function declaredScope(name) {
    let references = context.getScope().references
      , i
    for (i = 0; i < references.length; i++) {
      if (references[i].identifier.name === name) {
        break
      }
    }
    if (!references[i]) return undefined
    return references[i].resolved.scope.type
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

      // go deep
      var namespace = namespaces.get(dereference.object.name)
      var namepath = [dereference.object.name]
      // while property is namespace and parent is member expression, keep validating
      while (namespace instanceof Map &&
             dereference.type === 'MemberExpression') {

        if (dereference.computed) {
          context.report(dereference.property,
            'Unable to validate computed reference to imported namespace \'' +
            dereference.object.name + '\'.')
          return
        }

        if (!namespace.has(dereference.property.name)) {
          context.report(
            dereference.property,
            makeMessage(dereference.property, namepath))
          break
        }

        // stash and pop
        namepath.push(dereference.property.name)
        namespace = namespace.get(dereference.property.name)
        dereference = dereference.parent
      }

    },

    'VariableDeclarator': function ({ id, init }) {
      if (init == null) return
      if (init.type !== 'Identifier') return
      if (!namespaces.has(init.name)) return

      // check for redefinition in intermediate scopes
      if (declaredScope(init.name) !== 'module') return

      // DFS traverse child namespaces
      function testKey(pattern, namespace, path = [init.name]) {
        if (!(namespace instanceof Map)) return
        if (pattern.type !== 'ObjectPattern') return

        for (let property of pattern.properties) {

          if (property.key.type !== 'Identifier') {
            context.report({
              node: property,
              message: 'Only destructure top-level names.',
            })
            continue
          }

          if (!namespace.has(property.key.name)) {
            context.report({
              node: property,
              message: makeMessage(property.key, path),
            })
            continue
          }

          path.push(property.key.name)
          testKey(property.value, namespace.get(property.key.name), path)
          path.pop()
        }
      }

      testKey(id, namespaces.get(init.name))
    },
  }
}
