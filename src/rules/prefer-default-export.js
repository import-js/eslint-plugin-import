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
      namedExportCount++
      namedExportNode = node
    },
    'ExportDefaultDeclaration': function() {
      hasDefaultExport = true
    },

    'Program:exit': function() {
      if (namedExportCount === 1 &&  specifierExportCount < 2 && !hasDefaultExport) {
        context.report(namedExportNode, 'Prefer default export.')
      }
    },
  }
}
