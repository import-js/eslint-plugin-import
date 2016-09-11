/**
 * @fileoverview Rule to warn about potentially confused use of name exports
 * @author Desmond Brand
 * @copyright 2016 Desmond Brand. All rights reserved.
 * See LICENSE in root directory for full license.
 */

import Map from 'es6-map'

import Exports from '../core/getExports'
import importDeclaration from '../importDeclaration'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

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
    node.id.properties.forEach(({key}) => {
      if (key != null) { // rest properties are null
        storePropertyLookup(objectName, key.name, key)
      }
    })
  }

  function handleProgramExit() {
    allPropertyLookups.forEach((lookups, objectName) => {
      const fileImport = fileImports.get(objectName)
      if (fileImport == null) return

      lookups.forEach(({propName, node}) => {
        // the default import can have a "default" property
        if (propName === 'default') {
          return
        }
        if (fileImport.exportMap.namespace.has(propName)) {
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
    })
  }

  return {
    'ImportDefaultSpecifier': handleImportDefault,
    'MemberExpression': handlePropLookup,
    'VariableDeclarator': handleDestructuringAssignment,
    'Program:exit': handleProgramExit,
  }
}
