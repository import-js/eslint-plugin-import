import ExportMap, { recursivePatternCapture } from '../ExportMap';
import docsUrl from '../docsUrl';

const includes = Function.bind.bind(Function.prototype.call)(Array.prototype.includes);
const flatMap = Function.bind.bind(Function.prototype.call)(Array.prototype.flatMap);

/*
Notes on TypeScript namespaces aka TSModuleDeclaration:

There are two forms:
- active namespaces: namespace Foo {} / module Foo {}
- ambient modules; declare module "eslint-plugin-import" {}

active namespaces:
- cannot contain a default export
- cannot contain an export all
- cannot contain a multi name export (export { a, b })
- can have active namespaces nested within them

ambient namespaces:
- can only be defined in .d.ts files
- cannot be nested within active namespaces
- have no other restrictions
*/

const rootProgram = 'root';
const tsTypePrefix = 'type:';

/**
 * Detect function overloads like:
 * ```ts
 * export function foo(a: number);
 * export function foo(a: string);
 * export function foo(a: number|string) { return a; }
 * ```
 * @param {Set<Object>} nodes
 * @returns {boolean}
 */
function isTypescriptFunctionOverloads(nodes) {
  const nodesArr = Array.from(nodes);

  const idents = flatMap(
    nodesArr,
    (node) => node.declaration && (
      node.declaration.type === 'TSDeclareFunction' // eslint 6+
      || node.declaration.type === 'TSEmptyBodyFunctionDeclaration' // eslint 4-5
    )
      ? node.declaration.id.name
      : [],
  );
  if (new Set(idents).size !== idents.length) {
    return true;
  }

  const types = new Set(nodesArr.map((node) => node.parent.type));
  if (!types.has('TSDeclareFunction')) {
    return false;
  }
  if (types.size === 1) {
    return true;
  }
  if (types.size === 2 && types.has('FunctionDeclaration')) {
    return true;
  }
  return false;
}

/**
 * Detect merging Namespaces with Classes, Functions, or Enums like:
 * ```ts
 * export class Foo { }
 * export namespace Foo { }
 * ```
 * @param {Set<Object>} nodes
 * @returns {boolean}
 */
function isTypescriptNamespaceMerging(nodes) {
  const types = new Set(Array.from(nodes, (node) => node.parent.type));
  const noNamespaceNodes = Array.from(nodes).filter((node) => node.parent.type !== 'TSModuleDeclaration');

  return types.has('TSModuleDeclaration')
    && (
      types.size === 1
      // Merging with functions
      || types.size === 2 && (types.has('FunctionDeclaration') || types.has('TSDeclareFunction'))
      || types.size === 3 && types.has('FunctionDeclaration') && types.has('TSDeclareFunction')
      // Merging with classes or enums
      || types.size === 2 && (types.has('ClassDeclaration') || types.has('TSEnumDeclaration')) && noNamespaceNodes.length === 1
    );
}

/**
 * Detect if a typescript namespace node should be reported as multiple export:
 * ```ts
 * export class Foo { }
 * export function Foo();
 * export namespace Foo { }
 * ```
 * @param {Object} node
 * @param {Set<Object>} nodes
 * @returns {boolean}
 */
function shouldSkipTypescriptNamespace(node, nodes) {
  const types = new Set(Array.from(nodes, (node) => node.parent.type));

  return !isTypescriptNamespaceMerging(nodes)
    && node.parent.type === 'TSModuleDeclaration'
    && (
      types.has('TSEnumDeclaration')
      || types.has('ClassDeclaration')
      || types.has('FunctionDeclaration')
      || types.has('TSDeclareFunction')
    );
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid any invalid exports, i.e. re-export of the same name.',
      url: docsUrl('export'),
    },
    schema: [],
  },

  create(context) {
    const namespace = new Map([[rootProgram, new Map()]]);

    function addNamed(name, node, parent, isType) {
      if (!namespace.has(parent)) {
        namespace.set(parent, new Map());
      }
      const named = namespace.get(parent);

      const key = isType ? `${tsTypePrefix}${name}` : name;
      let nodes = named.get(key);

      if (nodes == null) {
        nodes = new Set();
        named.set(key, nodes);
      }

      nodes.add(node);
    }

    function getParent(node) {
      if (node.parent && node.parent.type === 'TSModuleBlock') {
        return node.parent.parent;
      }

      // just in case somehow a non-ts namespace export declaration isn't directly
      // parented to the root Program node
      return rootProgram;
    }

    return {
      ExportDefaultDeclaration(node) {
        addNamed('default', node, getParent(node));
      },

      ExportSpecifier(node) {
        addNamed(
          node.exported.name || node.exported.value,
          node.exported,
          getParent(node.parent),
        );
      },

      ExportNamedDeclaration(node) {
        if (node.declaration == null) { return; }

        const parent = getParent(node);
        // support for old TypeScript versions
        const isTypeVariableDecl = node.declaration.kind === 'type';

        if (node.declaration.id != null) {
          if (includes([
            'TSTypeAliasDeclaration',
            'TSInterfaceDeclaration',
          ], node.declaration.type)) {
            addNamed(node.declaration.id.name, node.declaration.id, parent, true);
          } else {
            addNamed(node.declaration.id.name, node.declaration.id, parent, isTypeVariableDecl);
          }
        }

        if (node.declaration.declarations != null) {
          for (const declaration of node.declaration.declarations) {
            recursivePatternCapture(declaration.id, (v) => { addNamed(v.name, v, parent, isTypeVariableDecl); });
          }
        }
      },

      ExportAllDeclaration(node) {
        if (node.source == null) { return; } // not sure if this is ever true

        // `export * as X from 'path'` does not conflict
        if (node.exported && node.exported.name) { return; }

        const remoteExports = ExportMap.get(node.source.value, context);
        if (remoteExports == null) { return; }

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node);
          return;
        }

        const parent = getParent(node);

        let any = false;
        remoteExports.forEach((v, name) => {
          if (name !== 'default') {
            any = true; // poor man's filter
            addNamed(name, node, parent);
          }
        });

        if (!any) {
          context.report(
            node.source,
            `No named exports found in module '${node.source.value}'.`,
          );
        }
      },

      'Program:exit'() {
        for (const [, named] of namespace) {
          for (const [name, nodes] of named) {
            if (nodes.size <= 1) { continue; }

            if (isTypescriptFunctionOverloads(nodes) || isTypescriptNamespaceMerging(nodes)) { continue; }

            for (const node of nodes) {
              if (shouldSkipTypescriptNamespace(node, nodes)) { continue; }

              if (name === 'default') {
                context.report(node, 'Multiple default exports.');
              } else {
                context.report(
                  node,
                  `Multiple exports of name '${name.replace(tsTypePrefix, '')}'.`,
                );
              }
            }
          }
        }
      },
    };
  },
};
