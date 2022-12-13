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

function processBodyStatement(importMap, node){
  if (node.type !== 'ImportDeclaration' || node.importKind === 'type') return;
  if (node.specifiers.length === 0) return;

  const specifiers = [];
  let hasDefaultImport= false;
  let hasInlineDefaultImport = false;
  let hasNamespaceImport =  false;
  
  node.specifiers.forEach((specifier)=>{
    if (specifier.type === 'ImportNamespaceSpecifier') {
      hasNamespaceImport = true;
    }
    // ignore the case for now. TODO: talk with Jordan and implement the handling of the rule here
    if (specifier.type === 'ImportDefaultSpecifier') {
      hasDefaultImport = true;
      specifiers.push(specifier);
    }
    if (specifier.type === 'ImportSpecifier') {
      // check if its {default as B}
      if (specifier.imported.name === 'default') {
        hasInlineDefaultImport = true;
      }
      specifiers.push(specifier);
    }
  });
  // cache all imports
  importMap.set(node.source.value, { specifiers, hasDefaultImport, hasInlineDefaultImport, hasNamespaceImport });
}

// It seems unfortunate to have a rule that is only useful for typescript, but perhaps a rule that detects your TS (or flow) version, 
// and can be configured for an order of preferences - ie, between "types as separate import statements", 
// "types mixed with values, but marked with a type modifier", you could prefer one over the other, 
// and it would fall back to the next one if the preferred one wasn't supported, and if neither are supported, the rule would noop.

// 3 options of prefering importing types: none, separate, modifier. 
// none => no use of word 'type' preferred. 
// separate: types as separate import statements
// modifier: types mixed with values, but marked with a type modifier

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

    const supportInlineTypeImport = tsVersionSatisfies('>=4.5'); // type modifiers (inline type import) were introduced in TS 4.5. 
    // get Rule options.
    let config = context.options[0];
    if (config.length === 2 && config[0] === 'inline' && !supportInlineTypeImport) {
      config = 'separate';
    }
    if (config[0] === 'separate') {
      config = 'separate';
    }

    const fixerArray = [];
    const typeImports = [];
    const valueImports =[];
    const valueNodeImports =[];
    const importSpecifierRanges = [];
    let allImportsSize = 0;
    const nonTypeImportDeclarations = new Map();

    return {
      'ImportDeclaration': function (node){

        if (config === 'separate' && node.importKind !== 'type') {
          // identify importSpecifiers that have inline type imports as well as value imports
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
              return;
            }
            // Question: do we want our rule to deal with default imports? It does not make sense that rule needs to since we do not know the type of default export.
            allImportsSize = allImportsSize + 1;
            // catch all inline imports and add them to the set
            if (specifier.importKind === 'type') {
              if (specifier.local.name !== specifier.imported.name) {
                typeImports.push(`${specifier.imported.name} as ${specifier.local.name}`);
              } else {
                typeImports.push(specifier.local.name);
              }
              importSpecifierRanges.push(specifier.range);
            } else {
              valueNodeImports.push(specifier);
              if (specifier.local.name !== specifier.imported.name) {
                valueImports.push(`${specifier.imported.name} as ${specifier.local.name}`);
              } else {
                valueImports.push(specifier.local.name);
              }
              importSpecifierRanges.push(specifier.range);
            }
          });
          // no inline type imports found
          if (typeImports.length === 0) {
            return;
          }
          // all inline imports are type imports => need to change it to separate import statement
          // import {type X, type Y} form 'x' => import type { X, Y} from 'x'
          if (typeImports.length === allImportsSize) {
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
          
          // there is a mix of inline value imports and type imports
          // import {type X, type Y, Z} form 'x' => import {Z} form 'x'\nimport type { X, Y } from 'x'
          else {
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const tokens = sourceCode.getTokens(node);
                const importPath = tokens[tokens.length-1].value;
  
                // remove all imports
                importSpecifierRanges.forEach((range)=>{
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

        if (config === 'inline' && node.importKind === 'type') {
          
          node.specifiers.forEach((specifier) => {
            if (specifier.local.name !== specifier.imported.name) {
              typeImports.push(`type ${specifier.imported.name} as ${specifier.local.name}`);
            } else {
              typeImports.push(`type ${specifier.local.name}`);
            }
            valueNodeImports.push(specifier);
          });
          
          // function process body statement to find if there are any non-type imports from the same location
          node.parent.body.forEach(declaration => processBodyStatement(nonTypeImportDeclarations, declaration));

          if (nonTypeImportDeclarations.has(node.source.value)) {
            // file has non type import from the same source
            const declaration = nonTypeImportDeclarations.get(node.source.value);
            // get the last specifier
            const  lastSpecifier = declaration.specifiers[declaration.specifiers.length - 1];

            // try to insert after the last specifier
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {

                if (lastSpecifier.type === 'ImportDefaultSpecifier' && declaration.specifiers.length === 1) {
                  // import defaultExport from 'x'
                  // import type { X, Y } from 'x'
                  // => import defaultExport, { type X, type Y } from 'x'
                  const inlineTypeImportsToInsert = ', { ' + typeImports.join(', ') + ' }';
                  fixerArray.push(fixer.insertTextAfter(lastSpecifier, inlineTypeImportsToInsert));
                } else {
                  // import { namedImport } from 'x'
                  // import type { X, Y } from 'x'
                  // => import { namedImport, type X, type Y } from 'x'
                  const inlineTypeImportsToInsert = ', ' + typeImports.join(', ');
                  fixerArray.push(fixer.insertTextAfter(lastSpecifier, inlineTypeImportsToInsert));
                }

                fixerArray.push(fixer.remove(node));
                return fixerArray;
              },
            });
          } else {
          // There are no other imports from the same location => remove 'type' next to import statement and add "type" to every named import
          // import type {a,b} from 'x' => import {type a, type b} from 'x'

            // TODO: check this statement: valueNodeImports => possibly rename it ?
            context.report({
              node,
              message: 'BOOM',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const tokens = sourceCode.getTokens(node);
                // log('tokens');
                // console.log(tokens);
                fixerArray.push(fixer.remove(tokens[1]));
                // log('value imports');
                // console.log(valueNodeImports);
                valueNodeImports.forEach(element => {
                  fixerArray.push(fixer.insertTextBefore(element, 'type '));
                });
                return fixerArray;
              },
            });
          }
          


        }
        
      },
    };
  },
};
