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
  },
};
