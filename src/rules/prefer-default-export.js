'use strict'

module.exports = function(context) {
  let specifierExportCount = 0
  let hasDefaultExport = false
  let hasStarExport = false
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
      // if there are specifiers, node.declaration should be null
      if (!node.declaration) return

      function captureDeclaration(identifierOrPattern) {
        if (identifierOrPattern.type === 'ObjectPattern') {
          // recursively capture
          identifierOrPattern.properties
            .forEach(function(property) {
              captureDeclaration(property.value)
            })
        } else {
        // assume it's a single standard identifier
          specifierExportCount++
        }
      }

      if (node.declaration.declarations) {
        node.declaration.declarations.forEach(function(declaration) {
          captureDeclaration(declaration.id)
        })
      }

      namedExportNode = node
    },

    'ExportDefaultDeclaration': function() {
      hasDefaultExport = true
    },

    'ExportAllDeclaration': function() {
      hasStarExport = true
    },

    'Program:exit': function() {
      if (specifierExportCount === 1 && !hasDefaultExport && !hasStarExport) {
        context.report(namedExportNode, 'Prefer default export.')
      }
    },
  }
}
