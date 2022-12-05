'use strict';

import debug from 'debug';
import docsUrl from '../docsUrl';

const log = debug('eslint-plugin-import/typescript-flow');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Prefer a default export if module exports a single name or multiple names.',
      url: docsUrl('prefer-default-export'),
    },
    schema: [{
      type: 'object',
      properties:{
        target: {
          type: 'string',
          enum: ['single', 'any'],
          default: 'single',
        },
      },
      additionalProperties: false,
    }],
  },

  create(context) {
    // if TS is < 3.8 => we can just name import it. 
 
    // works from typescript > 3.8
    // import type { Person, Cache } from "./foo"  // ImportDeclaration importKind = 'type', ImportSpecifier.importKind = 'value'

    // works only on typescript >4.5
    // import { type Person, Cache } from "./foo"; // ImportDeclaration importKind = 'value', ImportSpecifier.importKind = 'type'

    log('parser');
    console.log(context.parserPath);

    return {
      'ImportDeclaration': function (node) {
        // check the options flow
        if (node.importKind === 'type') {
          log('IF');
          console.log(node);
        } else {
          context.report(node, 'BOOM');
        }
      },
    };
  },
};
