'use strict';

import docsUrl from '../docsUrl';

// import debug from 'debug';
// const log = debug('eslint-plugin-import/typescript-flow');

import typescriptPkg from 'typescript/package.json';
import semver from 'semver';

function tsVersionSatisfies(specifier) {
  return semver.satisfies(typescriptPkg.version, specifier);
}

const SEPARATE_ERROR_MESSAGE = 'Type imports should be separately imported.';
const INLINE_ERROR_MESSAGE = 'Type imports should be imported inline with type modifier.';

// TODO: revert changes in ExportMap file. 
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
          'minItems': 2,
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

    // 3 cases: strict cases: separate, inline. 3rd case is array of preference. The only thing to check is if arr[0] === inline => 
    // check if it can be supported. If not, fall back on separate. 
    // If arr[0] === separate => just assume it is separate

    const isInlineTypeImportSupported = tsVersionSatisfies('>=4.5'); // type modifiers (inline type import) were introduced in TS 4.5. 
    // get Rule options.
    const config = getRuleConfig(context.options[0], isInlineTypeImportSupported);

    const typeImportSpecifiers = [];
    const valueImportSpecifiers =[];
    const valueImportNodes =[];
    const importSpecifierRanges = [];


    const specifierCache = {
      typeImportSpecifiers, valueImportSpecifiers, valueImportNodes, importSpecifierRanges,
    };


    return {
      'ImportDeclaration': function (node){

        if (config === 'inline' && !isInlineTypeImportSupported) {
          context.report(node, 'Type modifiers are not supported by your version of TS.');
        }


        if (config === 'separate' && node.importKind !== 'type') {
          // identify importSpecifiers that have inline type imports as well as value imports
          if (!setImportSpecifierCacheForSeparate(node.specifiers, specifierCache)) return;

          // no inline type imports found
          if (typeImportSpecifiers.length === 0) return;

          if (typeImportSpecifiers.length === typeImportSpecifiers.length + valueImportSpecifiers.length) {
            changeInlineImportToSeparate(node, context);
          }
          else { 
            addSeparateTypeImportDeclaration(node, context, specifierCache);
          }
        }


        if (config === 'inline' && node.importKind === 'type') {
          // ignore default type import like: import type A from 'x'
          if (node.specifiers.length === 1 && node.specifiers[0].type === 'ImportDefaultSpecifier') {
            return;
          }
          setImportSpecifierCacheForInline(node, specifierCache);
          const sameSourceValueImport = getImportDeclarationFromTheSameSource(node);
          if (sameSourceValueImport && !sameSourceValueImport.hasNamespaceImport) {
            insertInlineTypeImportsToSameSourceImport(node, context, sameSourceValueImport, typeImportSpecifiers);
          } else {
            changeToInlineTypeImport(node, context, valueImportNodes);
          }
        }
      },
    };
  },
};


function getRuleConfig(config, isInlineTypeImportSupported) {
  if (config.length === 2 && config[0] === 'inline' && !isInlineTypeImportSupported) {
    config = 'separate';
  }
  if (config[0] === 'separate') {
    config = 'separate';
  }
  return config;
}

/* 
  Functions for config === separate
*/ 
function setImportSpecifierCacheForSeparate(specifiers, specifierCache) {
  const typeImportSpecifiers = specifierCache.typeImportSpecifiers;
  const valueImportSpecifiers = specifierCache.valueImportSpecifiers;
  const valueImportNodes = specifierCache.valueImportNodes;
  const importSpecifierRanges = specifierCache.importSpecifierRanges;

  for (let i = 0; i < specifiers.length; i++) {
    const specifier = specifiers[i];
    if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
      return false;
    }
    specifierCache.allImportsSize = specifierCache.allImportsSize + 1;
    if (specifier.importKind === 'type') {
      if (specifier.local.name !== specifier.imported.name) {
        typeImportSpecifiers.push(`${specifier.imported.name} as ${specifier.local.name}`);
      } else {
        typeImportSpecifiers.push(specifier.local.name);
      }
      importSpecifierRanges.push(specifier.range);
    } else {
      valueImportNodes.push(specifier);
      if (specifier.local.name !== specifier.imported.name) {
        valueImportSpecifiers.push(`${specifier.imported.name} as ${specifier.local.name}`);
      } else {
        valueImportSpecifiers.push(specifier.local.name);
      }
      importSpecifierRanges.push(specifier.range);
    }
  }
  return true;
}

function changeInlineImportToSeparate(node, context){
  // all inline imports are type imports => need to change it to separate import statement
  // import {type X, type Y} form 'x' => import type { X, Y} from 'x'

  const fixerArray = [];
  context.report({
    node,
    message: SEPARATE_ERROR_MESSAGE,
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

function addSeparateTypeImportDeclaration(node, context, specifierCache) {
  // there is a mix of inline value imports and type imports
  // import {type X, type Y, Z} form 'x' => import {Z} form 'x'\nimport type { X, Y } from 'x'
  const fixerArray = [];
  const importSpecifierRanges = specifierCache.importSpecifierRanges;
  const valueImportSpecifiers = specifierCache.valueImportSpecifiers;
  const typeImportSpecifiers = specifierCache.typeImportSpecifiers;

  context.report({
    node,
    message: SEPARATE_ERROR_MESSAGE,
    fix(fixer) {
      const sourceCode = context.getSourceCode();
      const tokens = sourceCode.getTokens(node);
      const importPath = tokens[tokens.length-1].value;

      // remove all imports
      importSpecifierRanges.forEach((range)=>{
        fixerArray.push(fixer.removeRange([range[0], range[1]]));
      });

      let namedImportStart = undefined;
      tokens.forEach( element => {
        if (element.value === '{') {
          namedImportStart = element;
        }
        if (element.value === ',') {
          fixerArray.push(fixer.remove(element));
        }   
      });
      fixerArray.push(fixer.insertTextAfter(namedImportStart, valueImportSpecifiers.join(', ')));
      fixerArray.push(fixer.insertTextAfter(node, `\nimport type { ${typeImportSpecifiers.join(', ')} } from ${importPath}`));
      return fixerArray;
    },
  });
}


/* 
  Functions for config === inline
*/ 

function setImportSpecifierCacheForInline(node, specifierCache) {
  const typeImportSpecifiers = specifierCache.typeImportSpecifiers;
  const valueImportNodes = specifierCache.valueImportNodes;

  for (let i = 0; i < node.specifiers.length; i++) {
    const specifier = node.specifiers[i];
    if (specifier.local.name !== specifier.imported.name) {
      typeImportSpecifiers.push(`type ${specifier.imported.name} as ${specifier.local.name}`);
    } else {
      typeImportSpecifiers.push(`type ${specifier.local.name}`);
    }
    valueImportNodes.push(specifier);
  }
}

function getImportDeclarationFromTheSameSource(node) {
  const importDeclarationCache = new Map();
  const body = node.parent.body;
  for (let j = 0; j < body.length; j++) {
    const element = body[j];
    processBodyStatement(importDeclarationCache, element);
  }
  return importDeclarationCache.get(node.source.value);
}

function processBodyStatement(importDeclarationCache, node){
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
    if (specifier.type === 'ImportDefaultSpecifier') {
      hasDefaultImport = true;
      specifiers.push(specifier);
    }
    if (specifier.type === 'ImportSpecifier') {
      if (specifier.imported.name === 'default') {
        hasInlineDefaultImport = true;
      }
      specifiers.push(specifier);
    }
  });
  importDeclarationCache.set(node.source.value, { specifiers, hasDefaultImport, hasInlineDefaultImport, hasNamespaceImport });
}

function insertInlineTypeImportsToSameSourceImport(node, context, sameSourceValueImport, typeImportSpecifiers) {
  const fixerArray = [];
  const  lastSpecifier = sameSourceValueImport.specifiers[sameSourceValueImport.specifiers.length - 1];

  context.report({
    node,
    message: INLINE_ERROR_MESSAGE,
    fix(fixer) {
      if (lastSpecifier.type === 'ImportDefaultSpecifier' && sameSourceValueImport.specifiers.length === 1) {
        // import defaultExport from 'x'
        // import type { X, Y } from 'x'
        // => import defaultExport, { type X, type Y } from 'x'
        const inlineTypeImportsToInsert = ', { ' + typeImportSpecifiers.join(', ') + ' }';
        fixerArray.push(fixer.insertTextAfter(lastSpecifier, inlineTypeImportsToInsert));
      } else {
        // import { namedImport } from 'x'
        // import type { X, Y } from 'x'
        // => import { namedImport, type X, type Y } from 'x'
        const inlineTypeImportsToInsert = ', ' + typeImportSpecifiers.join(', ');
        fixerArray.push(fixer.insertTextAfter(lastSpecifier, inlineTypeImportsToInsert));
      }

      fixerArray.push(fixer.remove(node));
      return fixerArray;
    },
  });
}

function changeToInlineTypeImport(node, context, valueNodeImports) {
  // There are no other imports from the same location => remove 'type' next to import statement and add "type" to every named import
  // import type {a,b} from 'x' => import {type a, type b} from 'x'

  const fixerArray = [];

  context.report({
    node,
    message: INLINE_ERROR_MESSAGE,
    fix(fixer) {
      const sourceCode = context.getSourceCode();
      const tokens = sourceCode.getTokens(node);
      fixerArray.push(fixer.remove(tokens[1]));
      valueNodeImports.forEach(element => {
        fixerArray.push(fixer.insertTextBefore(element, 'type '));
      });
      return fixerArray;
    },
  });
}
