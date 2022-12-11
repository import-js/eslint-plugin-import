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

    // 3 cases: strict cases: separate, inline. 3rd case is array of preference. The only thing to check is if arr[0] === inline => 
    // check if it can be supported. If not, fall back on separate. 
    // If arr[0] === separate => just do separate ? Then what is really a logic? Taking care of user worrying about TS version?

    const supportInlineTypeImport = tsVersionSatisfies('>=4.5'); // type modifiers were introduced in TS 4.5. 
    // get Rule options.
    let config = context.options[0];
    if (config.length === 2 && config[0] === 'inline' && !supportInlineTypeImport) {
      config = 'separate';
    }

    const fixerArray = [];
    const typeImports = [];
    const valueImports =[];
    const importRangesToBeRemoved = [];
    let allImportsSize = 0;

    return {

      'ImportDeclaration': function (node){
        
        // identify importSpecifiers that have inline type imports as well as value imports
        node.specifiers.forEach((specifier) => {
          // Question: do we want our rule to deal with default imports? It does not make sense that rule needs to since we do not know the type of default export.
          // For now, ignore default export
          if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
            return;
          }
          allImportsSize += 1;
          // catch all inline imports and add them to the set
          if (specifier.importKind === 'type') {
            if (specifier.local.name !== specifier.imported.name) {
              typeImports.push(`${specifier.imported.name} as ${specifier.local.name}`);
            } else {
              typeImports.push(specifier.local.name);
            }
            importRangesToBeRemoved.push(specifier.range);
          } else {
            if (specifier.local.name !== specifier.imported.name) {
              valueImports.push(`${specifier.imported.name} as ${specifier.local.name}`);
            } else {
              valueImports.push(specifier.local.name);
            }
            importRangesToBeRemoved.push(specifier.range);
          }
        });

        if (config === 'separate' && node.importKind !== 'type') {
          // no inline type imports found
          if (typeImports.length === 0) {
            return;
          } else if (typeImports.length === allImportsSize) {
            // all inline imports are type imports => need to change it to separate import statement
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const tokens = sourceCode.getTokens(node);
                tokens.forEach(token => {
                  if (token.value === 'type') {
                    fixerArray.push(fixer.remove(token));
                  }
                });
                fixerArray.push(fixer.insertTextAfter(tokens[0], ' type'));
                return fixerArray;
              },
            });
          }
          else {
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const tokens = sourceCode.getTokens(node);
                const importPath = tokens[tokens.length-1].value;
  
                // remove all imports
                importRangesToBeRemoved.forEach((range)=>{
                  fixerArray.push(fixer.removeRange([range[0], range[1]]));
                });

                let namedImportStart = undefined;
                // remove all commas
                tokens.forEach( element => {
                  if (element.value === '{') {
                    namedImportStart = element;
                  }
                  if (element.value === ',') {
                    fixerArray.push(fixer.remove(element));
                  }   
                });
                // add inline value imports back
                fixerArray.push(fixer.insertTextAfter(namedImportStart, valueImports.join(', ')));
                // add new line with separate type import
                fixerArray.push(fixer.insertTextAfter(node, `\nimport type { ${typeImports.join(', ')} } from ${importPath}`));
                return fixerArray;
              },
            });
          }
        }
        
      },
    };
  },
};
