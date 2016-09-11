import Map from 'es6-map'

import Exports from '../core/getExports'
import importDeclaration from '../importDeclaration'
import declaredScope from '../core/declaredScope'

exports.meta = {
  schema: [
    {
      'type': 'object',
      'properties': {
        'allowComputed': {
          'description':
            'If `false`, will report computed (and thus, un-lintable) references ' +
            'to namespace members.',
          'type': 'boolean',
          'default': false,
        },
      },
      'additionalProperties': false,
    },
  ],
}

exports.create = function namespaceRule(context) {

  // read options
  const {
    allowComputed = false,
  } = context.options[0] || {}

  const namespaces = new Map()

  function makeMessage(last, namepath) {
     return `'${last.name}' not found in` +
            (namepath.length > 1 ? ' deeply ' : ' ') +
            `imported namespace '${namepath.join('.')}'.`
  }

  return {

    // pick up all imports at body entry time, to properly respect hoisting
    'Program': function ({ body }) {
      function processBodyStatement(declaration) {
        if (declaration.type !== 'ImportDeclaration') return

        if (declaration.specifiers.length === 0) return

        const imports = Exports.get(declaration.source.value, context)
        if (imports == null) return null

        if (imports.errors.length) {
          imports.reportErrors(context, declaration)
          return
        }

        declaration.specifiers.forEach((specifier) => {
          switch (specifier.type) {
            case 'ImportNamespaceSpecifier':
              if (!imports.size) {
                context.report(specifier,
                  `No exported names found in module '${declaration.source.value}'.`)
              }
              namespaces.set(specifier.local.name, imports)
              break
            case 'ImportDefaultSpecifier':
            case 'ImportSpecifier': {
              const meta = imports.get(
                // default to 'default' for default http://i.imgur.com/nj6qAWy.jpg
                specifier.imported ? specifier.imported.name : 'default')
              if (!meta || !meta.namespace) break
              namespaces.set(specifier.local.name, meta.namespace)
              break
            }
          }
        })
      }
      body.forEach(processBodyStatement)
    },

    // same as above, but does not add names to local map
    'ExportNamespaceSpecifier': function (namespace) {
      var declaration = importDeclaration(context)

      var imports = Exports.get(declaration.source.value, context)
      if (imports == null) return null

      if (imports.errors.length) {
        imports.reportErrors(context, declaration)
        return
      }

      if (!imports.size) {
        context.report(namespace,
          `No exported names found in module '${declaration.source.value}'.`)
      }
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
      while (namespace instanceof Exports &&
             dereference.type === 'MemberExpression') {

        if (dereference.computed) {
          if (!allowComputed) {
            context.report(dereference.property,
              'Unable to validate computed reference to imported namespace \'' +
              dereference.object.name + '\'.')
          }
          return
        }

        if (!namespace.has(dereference.property.name)) {
          context.report(
            dereference.property,
            makeMessage(dereference.property, namepath))
          break
        }

        const exported = namespace.get(dereference.property.name)
        if (exported == null) return

        // stash and pop
        namepath.push(dereference.property.name)
        namespace = exported.namespace
        dereference = dereference.parent
      }

    },

    'VariableDeclarator': function ({ id, init }) {
      if (init == null) return
      if (init.type !== 'Identifier') return
      if (!namespaces.has(init.name)) return

      // check for redefinition in intermediate scopes
      if (declaredScope(context, init.name) !== 'module') return

      // DFS traverse child namespaces
      function testKey(pattern, namespace, path = [init.name]) {
        if (!(namespace instanceof Exports)) return

        if (pattern.type !== 'ObjectPattern') return

        pattern.properties.forEach((property) => {
          if (property.key.type !== 'Identifier') {
            context.report({
              node: property,
              message: 'Only destructure top-level names.',
            })
          } else if (!namespace.has(property.key.name)) {
            context.report({
              node: property,
              message: makeMessage(property.key, path),
            })
          } else {
            path.push(property.key.name)
            testKey(property.value, namespace.get(property.key.name).namespace, path)
            path.pop()
          }
        })
      }

      testKey(id, namespaces.get(init.name))
    },
  }
}
