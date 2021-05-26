import minimatch from 'minimatch';
import path from 'path';
import pkgUp from 'pkg-up';

function getEntryPoint(context) {
  const pkgPath = pkgUp.sync(context.getFilename());
  try {
    return require.resolve(path.dirname(pkgPath));
  } catch (error) {
    // Assume the package has no entrypoint (e.g. CLI packages)
    // in which case require.resolve would throw.
    return null;
  }
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
      const fileName = context.getFilename();
      const isEntryPoint = entryPoint === fileName;
      const isIdentifier = node.object.type === 'Identifier';
      const hasKeywords = (/^(module|exports)$/).test(node.object.name);
      const isException = options.exceptions &&
        options.exceptions.some(glob => minimatch(fileName, glob));

      if (isIdentifier && hasKeywords && !isEntryPoint && !isException) {
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
