/**
 * @fileOverview Rule to warn about importing a default export by different name
 * @author James Whitney
 */

import docsUrl from '../docsUrl';
import ExportMapBuilder from '../exportMap/builder';
import path from 'path';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('@typescript-eslint/utils').TSESLint.RuleModule} */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid importing a default export by a different name.',
      recommended: false,
      url: docsUrl('no-named-as-default'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          commonjs: {
            default: false,
            type: 'boolean',
          },
          preventRenamingBindings: {
            default: true,
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const {
      commonjs = false,
      preventRenamingBindings = true,
    } = context.options[0] || {};

    function findDefaultDestructure(properties) {
      const found = properties.find((property) => {
        if (property.key.name === 'default') {
          return property;
        }
      });
      return found;
    }

    function getDefaultExportName(targetNode) {
      if (targetNode == null) {
        return;
      }
      switch (targetNode.type) {
        case 'AssignmentExpression': {
          if (!preventRenamingBindings) {
            // Allow assignments to be renamed when the `preventRenamingBindings`
            // option is set to `false`.
            //
            // export default Foo = 1;
            return;
          }
          return targetNode.left.name;
        }
        case 'CallExpression': {
          const [argumentNode] = targetNode.arguments;
          return getDefaultExportName(argumentNode);
        }
        case 'ClassDeclaration': {
          if (targetNode.id && typeof targetNode.id.name === 'string') {
            return targetNode.id.name;
          }
          // Here we have an anonymous class. We can skip here.
          return;
        }
        case 'ExportSpecifier': {
          return targetNode.local.name;
        }
        case 'FunctionDeclaration': {
          return targetNode.id.name;
        }
        case 'Identifier': {
          if (!preventRenamingBindings) {
            // Allow identifier to be renamed when the `preventRenamingBindings`
            // option is set to `false`.
            //
            // const foo = 'foo';
            // export default foo;
            return;
          }
          return targetNode.name;
        }
        default:
          // This type of node is not handled.
          // Returning `undefined` here signifies this and causes the check to
          // exit early.
      }
    }

    function getDefaultExportNode(exportMap) {
      const defaultExportNode = exportMap.exports.get('default');
      if (defaultExportNode == null) {
        return;
      }
      switch (defaultExportNode.type) {
        case 'ExportDefaultDeclaration': {
          return defaultExportNode.declaration;
        }
        case 'ExportNamedDeclaration': {
          return defaultExportNode.specifiers.find((specifier) => specifier.exported.name === 'default');
        }
        default:
          return;
      }
    }

    function getExportMap(source, context) {
      const exportMap = ExportMapBuilder.get(source.value, context);
      if (exportMap == null) {
        return;
      }
      if (exportMap.errors.length > 0) {
        exportMap.reportErrors(context, source.value);
        return;
      }
      return exportMap;
    }

    function handleImport(node) {
      const exportMap = getExportMap(node.parent.source, context);
      if (exportMap == null) {
        return;
      }

      const defaultExportNode = getDefaultExportNode(exportMap);
      if (defaultExportNode == null) {
        return;
      }

      const defaultExportName = getDefaultExportName(defaultExportNode);
      if (defaultExportName === undefined) {
        return;
      }

      const importTarget = node.parent.source.value;
      const importBasename = path.basename(exportMap.path);

      if (node.type === 'ImportDefaultSpecifier') {
        const importName = node.local.name;

        if (importName === defaultExportName) {
          return;
        }

        context.report({
          node,
          message: `Caution: \`${importBasename}\` has a default export \`${defaultExportName}\`. This imports \`${defaultExportName}\` as \`${importName}\`. Check if you meant to write \`import ${defaultExportName} from '${importTarget}'\` instead.`,
        });

        return;
      }

      if (node.type !== 'ImportSpecifier') {
        return;
      }

      if (node.imported.name !== 'default') {
        return;
      }

      const actualImportedName = node.local.name;

      if (actualImportedName === defaultExportName) {
        return;
      }

      context.report({
        node,
        message: `Caution: \`${importBasename}\` has a default export \`${defaultExportName}\`. This imports \`${defaultExportName}\` as \`${actualImportedName}\`. Check if you meant to write \`import { default as ${defaultExportName} } from '${importTarget}'\` instead.`,
      });
    }

    function handleRequire(node) {
      if (
        !commonjs
        || node.type !== 'VariableDeclarator'
        || !node.id || !(node.id.type === 'Identifier' || node.id.type === 'ObjectPattern')
        || !node.init || node.init.type !== 'CallExpression'
      ) {
        return;
      }

      let defaultDestructure;
      if (node.id.type === 'ObjectPattern') {
        defaultDestructure = findDefaultDestructure(node.id.properties);
        if (defaultDestructure === undefined) {
          return;
        }
      }

      const call = node.init;
      const [source] = call.arguments;

      if (
        call.callee.type !== 'Identifier' || call.callee.name !== 'require' || call.arguments.length !== 1
        || source.type !== 'Literal'
      ) {
        return;
      }

      const exportMap = getExportMap(source, context);
      if (exportMap == null) {
        return;
      }

      const defaultExportNode = getDefaultExportNode(exportMap);
      if (defaultExportNode == null) {
        return;
      }

      const defaultExportName = getDefaultExportName(defaultExportNode);
      const requireTarget = source.value;
      const requireBasename = path.basename(exportMap.path);
      const requireName = node.id.type === 'Identifier' ? node.id.name : defaultDestructure.value.name;

      if (defaultExportName === undefined) {
        return;
      }

      if (requireName === defaultExportName) {
        return;
      }

      if (node.id.type === 'Identifier') {
        context.report({
          node,
          message: `Caution: \`${requireBasename}\` has a default export \`${defaultExportName}\`. This requires \`${defaultExportName}\` as \`${requireName}\`. Check if you meant to write \`const ${defaultExportName} = require('${requireTarget}')\` instead.`,
        });
        return;
      }

      context.report({
        node,
        message: `Caution: \`${requireBasename}\` has a default export \`${defaultExportName}\`. This requires \`${defaultExportName}\` as \`${requireName}\`. Check if you meant to write \`const { default: ${defaultExportName} } = require('${requireTarget}')\` instead.`,
      });
    }

    return {
      ImportDefaultSpecifier(node) {
        handleImport(node);
      },
      ImportSpecifier(node) {
        handleImport(node);
      },
      VariableDeclarator(node) {
        handleRequire(node);
      },
    };
  },
};

module.exports = rule;
