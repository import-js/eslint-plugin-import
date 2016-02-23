import Exports from '../core/getExports'
import declaredScope from '../core/declaredScope'

module.exports = function (context) {
  const deprecated = new Map()

  function checkSpecifiers(node) {
    if (node.source == null) return // local export, ignore

    const imports = Exports.get(node.source.value, context)
    if (imports == null) return

    if (imports.errors.length) {
      imports.reportErrors(context, node)
      return
    }

    function getDeprecation(imported) {
      const metadata = imports.named.get(imported)
      if (!metadata || !metadata.doc) return

      let deprecation
      if (metadata.doc.tags.some(t => t.title === 'deprecated' && (deprecation = t))) {
        return deprecation
      }
    }

    node.specifiers.forEach(function (im) {
      let imported, local
      switch (im.type) {

        // case 'ImportNamespaceSpecifier':{
        //   const submap = new Map()
        //   for (let name in imports.named) {
        //     const deprecation = getDeprecation(name)
        //     if (!deprecation) continue
        //     submap.set(name, deprecation)
        //   }
        //   if (submap.size > 0) deprecated.set(im.local.name, submap)
        //   return
        // }

        case 'ImportDefaultSpecifier':
          imported = 'default'
          local = im.local.name
          break

        case 'ImportSpecifier':
          imported = im.imported.name
          local = im.local.name
          break

        default: return // can't handle this one
      }

      // unknown thing can't be deprecated
      if (!imports.named.has(imported)) return

      const deprecation = getDeprecation(imported)
      if (!deprecation) return

      context.report({ node: im, message: message(deprecation) })

      deprecated.set(local, deprecation)

    })
  }

  return {
    'ImportDeclaration': checkSpecifiers,

    'Identifier': function (node) {
      // ignore specifier identifiers
      if (node.parent.type.slice(0, 6) === 'Import') return

      if (!deprecated.has(node.name)) return

      if (declaredScope(context, node.name) !== 'module') return
      context.report({
        node,
        message: message(deprecated.get(node.name)),
      })
    },
  }
}

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.')
}
