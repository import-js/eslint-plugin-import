'use strict'

module.exports = function(context) {
  let namedExportCount = 0
  let specifierExportCount = 0
  let hasDefaultExport = false
  let namedExportNode = null
  return {
    'ExportSpecifier': function(node) {
      if (node.exported.name === 'default') {
        hasDefaultExport = true
      } else {
        specifierExportCount++
        namedExportNode = node
      }
    },
    'ExportNamedDeclaration': function(node) {
      if (node.declaration &&
          node.declaration.declarations.length &&
          node.declaration.declarations[0].id.type === 'ObjectPattern') {

        namedExportCount += node.declaration.declarations[0].id.properties.length
      } else {
        namedExportCount++
      }

      namedExportNode = node
    },
    'ExportDefaultDeclaration': function() {
      hasDefaultExport = true
    },

    'Program:exit': function() {
      if (namedExportCount === 1 && specifierExportCount < 2 && !hasDefaultExport) {
        context.report(namedExportNode, 'Prefer default export.')
      }
    },
  }
}
