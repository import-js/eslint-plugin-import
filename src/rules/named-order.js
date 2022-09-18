'use strict';

import docsUrl from '../docsUrl';

//
// utils
//

function getOptions(context) {
  const {
    caseInsensitive = false,
    order = 'asc',
    commonjs = true,
    esmodule = true,
  } = context.options[0] || {};

  return {
    caseInsensitive,
    order,
    commonjs,
    esmodule,
  };
}

function isArrayShallowEquals(left, right) {
  return left.length === right.length && left.every((leftValue, offset) => {
    const rightValue = right[offset];
    return leftValue === rightValue;
  });
}

function getFullRangeOfNodes(nodes) {
  const ranges = nodes.map(node => node.range);
  const rangeFrom = Math.min(...ranges[0]);
  const rangeTo = Math.max(...ranges[1]);
  return [rangeFrom, rangeTo];
}

function compareString(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function makeDeepSorter(options, sortFieldKeyPath) {
  const orderMultiplier = options.order === 'desc' ? -1 : 1;

  const sortFieldKeys = sortFieldKeyPath.split('.');

  function getNormalizedValue(rootValue) {
    const value = sortFieldKeys.reduce((value, key) => value[key], rootValue);

    return options.caseInsensitive
      ? String(value).toLowerCase()
      : String(value);
  }

  return function sorter(left, right) {
    const leftValue = getNormalizedValue(left);
    const rightValue = getNormalizedValue(right);

    const order = compareString(leftValue, rightValue);
  
    return order * orderMultiplier;
  };
}

//
// named-order rule
// 

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('named-order'),
    },

    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          caseInsensitive: {
            type: 'boolean',
            default: false,
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
          },
          commonjs: {
            type: 'boolean',
            default: true,
          },
          esmodule: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function namedOrderRule(context) {
    const options = getOptions(context);
    const sourceCode = context.getSourceCode();

    function getSourceCodeTextOfNode(node) {
      const [from, to] = node.range;
      return sourceCode.text.substring(from, to);
    }

    // sorters
    const namedImportSpecifierSorter = makeDeepSorter(options, 'imported.name');
    const namedExportSpecifierSorter = makeDeepSorter(options, 'exported.name');
    const requireIdPropertySorter = makeDeepSorter(options, 'key.name');

    return {
      ImportDeclaration: function handleImports(node) {
        if (
          !options.esmodule
          || !node 
          || node.type !== 'ImportDeclaration'
          || !node.specifiers 
          || node.specifiers.length === 0
        ) {
          return;
        }
      
        const { specifiers } = node;

        const sortedSpecifiers = [...specifiers].sort(namedImportSpecifierSorter);

        if (!isArrayShallowEquals(specifiers, sortedSpecifiers)) {
          const sourceString = specifiers.map(getSourceCodeTextOfNode).join(', ');
          const sourceFullRange = getFullRangeOfNodes(specifiers);
          const destinationString = sortedSpecifiers.map(getSourceCodeTextOfNode).join(', ');

          context.report({
            node,
            message: `Named import specifiers of \`${sourceString}\` should sort as \`${destinationString}\``,
            fix(fixer) {
              return fixer.replaceTextRange(sourceFullRange, destinationString);
            },
          });
        }
      },
      ExportNamedDeclaration: function handleExports(node) {
        if (
          !options.esmodule
          || !node
          || node.type !== 'ExportNamedDeclaration'
          || !node.specifiers
          || node.specifiers.length === 0) {
          return;
        }

        const { specifiers } = node;

        const sortedSpecifiers = [...specifiers].sort(namedExportSpecifierSorter);

        if (!isArrayShallowEquals(specifiers, sortedSpecifiers)) {
          const sourceString = specifiers.map(getSourceCodeTextOfNode).join(', ');
          const sourceFullRange = getFullRangeOfNodes(specifiers);
          const destinationString = sortedSpecifiers.map(getSourceCodeTextOfNode).join(', ');

          context.report({
            node,
            message: `Named export specifiers of \`${sourceString}\` should sort as \`${destinationString}\``,
            fix(fixer) {
              return fixer.replaceTextRange(sourceFullRange, destinationString);
            },
          });
        }
      },
      VariableDeclarator: function handleRequires(node) {
        if (
          !options.commonjs
          || !node
          // check root node
          || node.type !== 'VariableDeclarator'
          // check it has valid properties
          || !node.id
          || node.id.type !== 'ObjectPattern'
          || node.id.properties.length === 0
          // check it is valid require()
          || !node.init
          || node.init.type !== 'CallExpression'
          || node.init.callee.type !== 'Identifier'
          || node.init.callee.name !== 'require'
          || node.init.arguments.length !== 1 
          || node.init.arguments[0].type !== 'Literal'
        ) {
          return;
        }

        const { properties } = node.id;

        const sortedProperties = [...properties].sort(requireIdPropertySorter);

        if (!isArrayShallowEquals(properties, sortedProperties)) {
          const sourceString = properties.map(getSourceCodeTextOfNode).join(', ');
          const sourceFullRange = getFullRangeOfNodes(properties);
          const destinationString = sortedProperties.map(getSourceCodeTextOfNode).join(', ');

          context.report({
            node,
            message: `Require specifiers of \`${sourceString}\` should sort as \`${destinationString}\``,
            fix(fixer) {
              return fixer.replaceTextRange(sourceFullRange, destinationString);
            },
          });
        }
      },
    };
  },
};
