'use strict';

import docsUrl from '../docsUrl';

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

  create: function namedOrderRule() {
  },
};
