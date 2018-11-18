/**
 * @fileoverview Rule to warn about potentially confused use of name exports
 * @author Desmond Brand
 * @copyright 2016 Desmond Brand. All rights reserved.
 * See LICENSE in root directory for full license.
 */
import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'
import docsUrl from '../docsUrl'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-named-as-default-member'),
    },
  },

  create: function(context) {

    const fileImports = new Map()
    const allPropertyLookups = new Map()

    function handleImportDefault(node) {
      const declaration = importDeclaration(context)
      const exportMap = Exports.get(declaration.source.value, context)
      if (exportMap == null) return

      if (exportMap.errors.length) {
        exportMap.reportErrors(context, declaration)
        return
      }

      fileImports.set(node.local.name, {
        exportMap,
        sourcePath: declaration.source.value,
      })
    }

    function storePropertyLookup(objectName, propName, node) {
      const lookups = allPropertyLookups.get(objectName) || []
      lookups.push({node, propName})
      allPropertyLookups.set(objectName, lookups)
    }

    function handlePropLookup(node) {
      const objectName = node.object.name
      const propName = node.property.name
      storePropertyLookup(objectName, propName, node)
    }

    function handleDestructuringAssignment(node) {
      const isDestructure = (
        node.id.type === 'ObjectPattern' &&
        node.init != null &&
        node.init.type === 'Identifier'
      )
      if (!isDestructure) return

      const objectName = node.init.name
      for (const { key } of node.id.properties) {
        if (key == null) continue  // true for rest properties
        storePropertyLookup(objectName, key.name, key)
      }
    }

    function handleProgramExit() {
      allPropertyLookups.forEach((lookups, objectName) => {
        const fileImport = fileImports.get(objectName)
        if (fileImport == null) return

        for (const {propName, node} of lookups) {
          // the default import can have a "default" property
          if (propName === 'default') continue
          if (!fileImport.exportMap.namespace.has(propName)) continue

          context.report({
            node,
            message: (
              `Caution: \`${objectName}\` also has a named export ` +
              `\`${propName}\`. Check if you meant to write ` +
              `\`import {${propName}} from '${fileImport.sourcePath}'\` ` +
              'instead.'
            ),
          })
        }
      })
    }

    return {
      'ImportDefaultSpecifier': handleImportDefault,
      'MemberExpression': handlePropLookup,
      'VariableDeclarator': handleDestructuringAssignment,
      'Program:exit': handleProgramExit,
    }
  },
}
