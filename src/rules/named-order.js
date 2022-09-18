'use strict';

import docsUrl from '../docsUrl';

//
// utils
//

const getOptions = (context) => {
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
};

const isArrayShallowEquals = (left, right) => {
  return left.length === right.length && left.every((leftValue, offset) => {
    const rightValue = right[offset];
    return leftValue === rightValue;
  });
};

const getFullRangeOfNodes = (nodes) => {
  const ranges = nodes.map(node => node.range);
  const rangeFrom = Math.min(...ranges[0]);
  const rangeTo = Math.max(...ranges[1]);
  return [rangeFrom, rangeTo];
};

const compareString = (left, right) => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

const makeDeepSorter = (options, sortFieldKeyPath) => {
  const orderMultiplier = options.order === 'desc' ? -1 : 1;

  const sortFieldKeys = sortFieldKeyPath.split('.');

  const getNormalizedValue = (rootValue) => {
    const value = sortFieldKeys.reduce((value, key) => value[key], rootValue);

    return options.caseInsensitive
      ? String(value).toLowerCase()
      : String(value);
  };

  return (left, right) => {
    const leftValue = getNormalizedValue(left);
    const rightValue = getNormalizedValue(right);

    const order = compareString(leftValue, rightValue);
  
    return order * orderMultiplier;
  };
};

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

    const getSourceCodeTextOfNode = (node) => {
      const [from, to] = node.range;
      return sourceCode.text.substring(from, to);
    };

    // sorters
    const namedImportSpecifierSorter = makeDeepSorter(options, 'imported.name');

    return {
      ImportDeclaration: (node) => {
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
            message: 'Named import specifiers of `{{{source}}}` should sort as `{{{destination}}}`',
            data: {
              source: sourceString,
              destination: destinationString,
            },
            fix(fixer) {
              return fixer.replaceTextRange(sourceFullRange, destinationString);
            },
          });
        }
      },
    };
  },
};
