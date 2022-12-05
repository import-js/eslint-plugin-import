'use strict';

import docsUrl from '../docsUrl';

import debug from 'debug';
const log = debug('eslint-plugin-import/typescript-flow');

// comes from tests/src/utils file, TODO?: import directly from there
import typescriptPkg from 'typescript/package.json';
import semver from 'semver';

function tsVersionSatisfies(specifier) {
  return semver.satisfies(typescriptPkg.version, specifier);
}

// It seems unfortunate to have a rule that is only useful for typescript, but perhaps a rule that detects your TS (or flow) version, 
// and can be configured for an order of preferences - ie, between "types as separate import statements", 
// "types mixed with values, but marked with a type modifier", you could prefer one over the other, 
// and it would fall back to the next one if the preferred one wasn't supported, and if neither are supported, the rule would noop.

// 3 options of prefering importing types: none, separate, modifier. 
// none => no use of word 'type' preferred. 
// separate: types as separate import statements
// modifier: types mixed with values, but marked with a type modifier

// To think about: if separate is preferred but none is used => need to check every import file. maybe exclude the none?
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
        prefer: {
          type: 'string',
          enum: ['none', 'separate', 'modifier'],
          default: 'modifier',
        },
      },
      additionalProperties: false,
    }],
  },

  create(context) {
    // if TS is < 3.8 => we can just name import it. 
 
    // works from typescript >= 3.8
    // import type { Person, Cache } from "./foo"  
    // ImportDeclaration importKind = 'type', ImportSpecifier.importKind = 'value'

    // works only on typescript >= 4.5
    // import { type Person, Cache } from "./foo"; 
    // ImportDeclaration importKind = 'value', ImportSpecifier.importKind = 'type'

    // get Rule options. Default: separate
    const { prefer = 'separate' } =  context.options[0] || {};

    const supportsTypeImport = tsVersionSatisfies('>=3.8'); // separate `import type { a } from 'x'` was introduced in TS 3.8
    const supportsTypeModifier = tsVersionSatisfies('>=4.5'); // type modifiers were introduced in TS 4.5. 

    return {
      'ImportDeclaration': function (node) {
        // case where we want type modifier but we got separate import type
        if (supportsTypeModifier && prefer === 'modifier' && node.importKind === 'type') {
          context.report(node, 'BOOM');
        }
      },
      'ImportSpecifier': function (node) {
        // we want separate import, but have type modifier
        if (supportsTypeImport && prefer === 'separate' && node.importKind === 'type') {
          context.report(node, 'BOOM');
        }
      },
    };
  },
};
