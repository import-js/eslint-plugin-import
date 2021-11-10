import minimatch from 'minimatch';
import path from 'path';
import pkgUp from 'eslint-module-utils/pkgUp';

function getEntryPoint(context) {
  const pkgPath = pkgUp({ cwd: context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename() });
  try {
    return require.resolve(path.dirname(pkgPath));
  } catch (error) {
    // Assume the package has no entrypoint (e.g. CLI packages)
    // in which case require.resolve would throw.
    return null;
  }
}

function findScope(context, identifier) {
  const { scopeManager } = context.getSourceCode();

  return scopeManager && scopeManager.scopes.slice().reverse().find((scope) => scope.variables.some(variable => variable.identifiers.some((node) => node.name === identifier)));
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow import statements with module.exports',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        'type': 'object',
        'properties': {
          'exceptions': { 'type': 'array' },
        },
        'additionalProperties': false,
      },
    ],
  },
  create(context) {
    const importDeclarations = [];
    const entryPoint = getEntryPoint(context);
    const options = context.options[0] || {};
    let alreadyReported = false;

    function report(node) {
      const fileName = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
      const isEntryPoint = entryPoint === fileName;
      const isIdentifier = node.object.type === 'Identifier';
      const hasKeywords = (/^(module|exports)$/).test(node.object.name);
      const objectScope = hasKeywords && findScope(context, node.object.name);
      const hasCJSExportReference = hasKeywords && (!objectScope || objectScope.type === 'module');
      const isException = !!options.exceptions && options.exceptions.some(glob => minimatch(fileName, glob));

      if (isIdentifier && hasCJSExportReference && !isEntryPoint && !isException) {
        importDeclarations.forEach(importDeclaration => {
          context.report({
            node: importDeclaration,
            message: `Cannot use import declarations in modules that export using ` +
              `CommonJS (module.exports = 'foo' or exports.bar = 'hi')`,
          });
        });
        alreadyReported = true;
      }
    }

    return {
      ImportDeclaration(node) {
        importDeclarations.push(node);
      },
      MemberExpression(node) {
        if (!alreadyReported) {
          report(node);
        }
      },
    };
  },
};
