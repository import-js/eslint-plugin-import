'use strict';

import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('prefer-default-export'),
    },
    schema: [],
  },

  create(context) {
    let specifierExportCount = 0;
    let hasDefaultExport = false;
    let hasStarExport = false;
    let hasTypeExport = false;
    let namedExportNode = null;

    function captureDeclaration(identifierOrPattern) {
      if (identifierOrPattern && identifierOrPattern.type === 'ObjectPattern') {
        // recursively capture
        identifierOrPattern.properties
          .forEach(function (property) {
            captureDeclaration(property.value);
          });
      } else if (identifierOrPattern && identifierOrPattern.type === 'ArrayPattern') {
        identifierOrPattern.elements
          .forEach(captureDeclaration);
      } else  {
      // assume it's a single standard identifier
        specifierExportCount++;
      }
    }

    return {
      'ExportDefaultSpecifier': function () {
        hasDefaultExport = true;
      },

      'ExportSpecifier': function (node) {
        if ((node.exported.name || node.exported.value) === 'default') {
          hasDefaultExport = true;
        } else {
          specifierExportCount++;
          namedExportNode = node;
        }
      },

      'ExportNamedDeclaration': function (node) {
        // if there are specifiers, node.declaration should be null
        if (!node.declaration) return;

        const { type } = node.declaration;

        if (
          type === 'TSTypeAliasDeclaration' ||
          type === 'TypeAlias' ||
          type === 'TSInterfaceDeclaration' ||
          type === 'InterfaceDeclaration'
        ) {
          specifierExportCount++;
          hasTypeExport = true;
          return;
        }

        if (node.declaration.declarations) {
          node.declaration.declarations.forEach(function (declaration) {
            captureDeclaration(declaration.id);
          });
        } else {
          // captures 'export function foo() {}' syntax
          specifierExportCount++;
        }

        namedExportNode = node;
      },

      'ExportDefaultDeclaration': function () {
        hasDefaultExport = true;
      },

      'ExportAllDeclaration': function () {
        hasStarExport = true;
      },

      'Program:exit': function () {
        if (specifierExportCount === 1 && !hasDefaultExport && !hasStarExport && !hasTypeExport) {
          context.report(namedExportNode, 'Prefer default export.');
        }
      },
    };
  },
};
