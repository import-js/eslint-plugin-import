/**
 * @fileOverview Forbids a module from importing from parent barrel file
 * @author jonioni
 */

const { parse } = require('path');
const resolve = require('eslint-module-utils/resolve').default;
const moduleVisitor = require('eslint-module-utils/moduleVisitor').default;
const docsUrl = require('../docsUrl').default;

function isImportingFromParentBarrel(context, node, requireName) {
  let filePath;
  if (context.getPhysicalFilename) {
    filePath = context.getPhysicalFilename();
  } else if (context.getFilename) {
    filePath = context.getFilename();
  }
  const importPath = resolve(requireName, context);
  console.info(`File Path: ${filePath} and ${importPath}`);
  const importDetails = parse(importPath);
  if (importDetails.name === 'index' && filePath.startsWith(importDetails.dir)) {
    context.report({
      node,
      message: 'Module imports from parent barrel file.',
    });
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Static analysis',
      description: 'Forbid a module from importing from parent barrel file.',
      recommended: true,
      url: docsUrl('no-parent-barrel-import'),
    },
    schema: [],
  },
  create(context) {
    return isImportingFromParentBarrel((source, node) => {
      moduleVisitor(context, node, source.value);
    });
  },
};
