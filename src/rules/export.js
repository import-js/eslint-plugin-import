import ExportMap, { recursivePatternCapture } from '../ExportMap'
import docsUrl from '../docsUrl'
import includes from 'array-includes'

/*
Notes on Typescript namespaces aka TSModuleDeclaration:

There are two forms:
- active namespaces: namespace Foo {} / module Foo {}
- ambient modules; declare module "eslint-plugin-import" {}

active namespaces:
- cannot contain a default export
- cannot contain an export all
- cannot contain a multi name export (export { a, b })
- can have active namespaces nested within them

ambient namespaces:
- can only be defined in .d.ts files
- cannot be nested within active namespaces
- have no other restrictions
*/

const rootProgram = 'root'
const tsTypePrefix = 'type:'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('export'),
    },
  },

  create: function (context) {
    const namespace = new Map([[rootProgram, new Map()]])

    function addNamed(name, node, parent, isType) {
      if (!namespace.has(parent)) {
        namespace.set(parent, new Map())
      }
      const named = namespace.get(parent)

      const key = isType ? `${tsTypePrefix}${name}` : name
      let nodes = named.get(key)

      if (nodes == null) {
        nodes = new Set()
        named.set(key, nodes)
      }

      nodes.add(node)
    }

    function getParent(node) {
      if (node.parent && node.parent.type === 'TSModuleBlock') {
        return node.parent.parent
      }

      // just in case somehow a non-ts namespace export declaration isn't directly
      // parented to the root Program node
      return rootProgram
    }

    return {
      'ExportDefaultDeclaration': (node) => addNamed('default', node, getParent(node)),

      'ExportSpecifier': (node) => addNamed(node.exported.name, node.exported, getParent(node)),

      'ExportNamedDeclaration': function (node) {
        if (node.declaration == null) return

        const parent = getParent(node)
        // support for old typescript versions
        const isTypeVariableDecl = node.declaration.kind === 'type'

        if (node.declaration.id != null) {
          if (includes([
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
          ], node.declaration.type)) {
            addNamed(node.declaration.id.name, node.declaration.id, parent, true)
          } else {
            addNamed(node.declaration.id.name, node.declaration.id, parent, isTypeVariableDecl)
          }
        }

        if (node.declaration.declarations != null) {
          for (let declaration of node.declaration.declarations) {
            recursivePatternCapture(declaration.id, v =>
              addNamed(v.name, v, parent, isTypeVariableDecl))
          }
        }
      },

      'ExportAllDeclaration': function (node) {
        if (node.source == null) return // not sure if this is ever true

        const remoteExports = ExportMap.get(node.source.value, context)
        if (remoteExports == null) return

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node)
          return
        }

        const parent = getParent(node)

        let any = false
        remoteExports.forEach((v, name) =>
          name !== 'default' &&
          (any = true) && // poor man's filter
          addNamed(name, node, parent))

        if (!any) {
          context.report(node.source,
            `No named exports found in module '${node.source.value}'.`)
        }
      },

      'Program:exit': function () {
        for (let [, named] of namespace) {
          for (let [name, nodes] of named) {
            if (nodes.size <= 1) continue

            for (let node of nodes) {
              if (name === 'default') {
                context.report(node, 'Multiple default exports.')
              } else {
                context.report(
                  node,
                  `Multiple exports of name '${name.replace(tsTypePrefix, '')}'.`
                )
              }
            }
          }
        }
      },
    }
  },
}
