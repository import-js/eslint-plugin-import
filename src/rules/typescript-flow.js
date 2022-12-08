'use strict';

import docsUrl from '../docsUrl';
import Exports from '../ExportMap';

import debug from 'debug';
const log = debug('eslint-plugin-import/typescript-flow');

// comes from tests/src/utils file, TODO?: import directly from there
import typescriptPkg from 'typescript/package.json';
import semver from 'semver';

function tsVersionSatisfies(specifier) {
  return semver.satisfies(typescriptPkg.version, specifier);
}
// no need to have separate function, or doing it before the program start running => need to incorporate inside of the function
function processBodyStatement(context, typeExports, node) {
  if (node.type !== 'ImportDeclaration') return;
  
  if (node.specifiers.length === 0) return;
  
  const imports = Exports.get(node.source.value, context);
  // log('imports');
  // console.log(imports.namespace);
  if (imports == null) return null;
  
  if (imports.errors.length > 0) {
    imports.reportErrors(context, node);
    return;
  }

  imports.namespace.forEach((value, key) =>{
    if (value === 'type') {
      typeExports.add(key);
    }
  });
  
  


  // node.specifiers.forEach((specifier) => {
  //   switch (specifier.type) {
  //   case 'ImportNamespaceSpecifier':
  //     if (!imports.size) {
  //       context.report(
  //         specifier,
  //         `No exported names found in module '${node.source.value}'.`,
  //       );
  //     }
  //     namespaces.set(specifier.local.name, imports);
  //     break;
  //   case 'ImportDefaultSpecifier':
  //   case 'ImportSpecifier': {
  //     const meta = imports.get(
  //       // default to 'default' for default https://i.imgur.com/nj6qAWy.jpg
  //       specifier.imported ? (specifier.imported.name || specifier.imported.value) : 'default',
  //     );
  //     if (!meta || !meta.namespace) { break; }
  //     namespaces.set(specifier.local.name, meta.namespace);
  //     break;
  //   }
  //   }
  // });
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
// Scenario: user imports exported types without explicitly saying type: TODO: check every import file if it's a type export -> use ExportMaps
// What is import namespaces => omit?

module.exports = {
  meta: {
    type: 'suggestion', // Layout?
    docs: {
      category: 'Style guide',
      description: 'Prefer a default export if module exports a single name or multiple names.', // TODO: change
      url: docsUrl('prefer-default-export'), // TODO: change
    },
    fixable: 'code',
    schema: [{
      'anyOf': [
        {
          'type': 'array',
          'items': {
            'type': 'string',
            'enum': ['separate', 'inline'],
          },
          'minItems': 1,
          'maxItems': 2,
          'uniqueItems': true,
        },
        {
          'type': 'string',
          'enum': ['separate', 'inline'],
        },
      ],
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

    // get Rule options.
    const config = context.options[0];
    
    // check the config
    const configSingle = typeof(context.options[0]) === 'string' ? true : false;

    const prefer = 'separate';

    // allow single value or array of values. When list of available values not possible => message: unfixable problem. When there is multiple problems, finds first value in the list and makes it happen.
    const supportsTypeImport = tsVersionSatisfies('>=3.8'); // separate `import type { a } from 'x'` was introduced in TS 3.8
    const supportsTypeModifier = tsVersionSatisfies('>=4.5'); // type modifiers were introduced in TS 4.5. 
    // TODO: check the array on TS version to leave possible options 
    // If ! supportsTypeModifier => remove type modifier from the array
    // if ! supportsTypeImport => check if options array has 'none', if not => flag an error

    // useful if we can just remove as.
    const typeExports = new Set();

    // TODO: filter down available preferences: find the first one available then use it as preferred. If none is option: find all type key words and auto fixer => remove them.
    // return 3 rule objets?
    return {
      // pick up all type imports at body entry time, to properly respect hoisting
      Program({ body }) {
        body.forEach(x => processBodyStatement(context, typeExports, x));
      },
      'ImportDeclaration': function (node) {

        if (typeof(context.options[0]) === 'string' || config.length === 1) {
          // only one config
          

          // Question: maybe we do not need to check the condition below because typescript checks for us?
        } else if ((config === 'separate' || config[0] === 'separate') && node.importKind === 'type' && !supportsTypeImport) {
          context.report({
            node,
            message: 'BOOM', // You version of Typescript does not support import type statements
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              // log('tokens -> need to find the one we need');
              const token = sourceCode.getTokens(node)[1];
              return fixer.replaceTextRange([token.range[0], token.range[1]+1], '');
            },
          });

          // Question TODO: If user wants inline, but we have separate, then which named imports should be autofixed to have 'type' next to them:
          // only exported types or also exported interaces ?

        }

        // Question TODO: iterate over all import specifiers and get a list of all inline type imports
        // If option is separate, but we got none as input, how do we determine which named imports get to the new line?
        // how to we deal when we have two fixers?

        // case where we want type modifier but we got separate import type
        if (supportsTypeModifier && prefer === 'modifier' && node.importKind === 'type') {
          context.report(node, 'BOOM');
        }
        
        // create a map for all imports?
      },
      'ImportSpecifier': function (node) {

        // cases when we have only one config option
        if (typeof(context.options[0]) === 'string' || config.length === 1) {
          // only one config
          
          // we have none, but have word type

          // wanted separate but got inline case. Question: How to make two fixes?
          if ((config === 'separate' || config[0] === 'separate') && node.importKind === 'type') {
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const token = sourceCode.getTokens(node);
                log('source code tokens');
                console.log(token);

                const tokenParent = sourceCode.getTokens(node.parent);
                log('source code tokens -- PARENT');
                console.log(tokenParent);
                return fixer.replaceTextRange([token.range[0], token.range[1]+1], '') ;
              },
            });
          }

        }

        // if none => remove all type key words ?

        // TODO: import Cache from "./foo";  import Default Specifier type?
      },
    };
  },
};
