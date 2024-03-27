import fs from 'fs';

import doctrine from 'doctrine';

import debug from 'debug';

import { SourceCode } from 'eslint';

import parse from 'eslint-module-utils/parse';
import visit from 'eslint-module-utils/visit';
import resolve from 'eslint-module-utils/resolve';
import isIgnored, { hasValidExtension } from 'eslint-module-utils/ignore';

import { hashObject } from 'eslint-module-utils/hash';
import * as unambiguous from 'eslint-module-utils/unambiguous';

import includes from 'array-includes';
import ExportMap from '.';
import { availableDocStyleParsers, captureDoc } from './doc';
import { childContext } from './childContext';
import { isEsModuleInterop } from './typescript';
import { Namespace } from './namespace';
import { processSpecifier } from './specifier';
import { RemotePath } from './remotePath';

const log = debug('eslint-plugin-import:ExportMap');

const exportCache = new Map();

const supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);

/**
 * sometimes legacy support isn't _that_ hard... right?
 */
function makeSourceCode(text, ast) {
  if (SourceCode.length > 1) {
    // ESLint 3
    return new SourceCode(text, ast);
  } else {
    // ESLint 4, 5
    return new SourceCode({ text, ast });
  }
}

/**
 * Traverse a pattern/identifier node, calling 'callback'
 * for each leaf identifier.
 * @param  {node}   pattern
 * @param  {Function} callback
 * @return {void}
 */
export function recursivePatternCapture(pattern, callback) {
  switch (pattern.type) {
    case 'Identifier': // base case
      callback(pattern);
      break;

    case 'ObjectPattern':
      pattern.properties.forEach((p) => {
        if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {
          callback(p.argument);
          return;
        }
        recursivePatternCapture(p.value, callback);
      });
      break;

    case 'ArrayPattern':
      pattern.elements.forEach((element) => {
        if (element == null) { return; }
        if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {
          callback(element.argument);
          return;
        }
        recursivePatternCapture(element, callback);
      });
      break;

    case 'AssignmentPattern':
      callback(pattern.left);
      break;
    default:
  }
}

/**
 * The creation of this closure is isolated from other scopes
 * to avoid over-retention of unrelated variables, which has
 * caused memory leaks. See #1266.
 */
function thunkFor(p, context) {
  // eslint-disable-next-line no-use-before-define
  return () => ExportMapBuilder.for(childContext(p, context));
}

function captureDependency(
  { source },
  isOnlyImportingTypes,
  remotePathResolver,
  exportMap,
  context,
  importedSpecifiers = new Set(),
) {
  if (source == null) { return null; }

  const p = remotePathResolver.resolve(source.value);
  if (p == null) { return null; }

  const declarationMetadata = {
    // capturing actual node reference holds full AST in memory!
    source: { value: source.value, loc: source.loc },
    isOnlyImportingTypes,
    importedSpecifiers,
  };

  const existing = exportMap.imports.get(p);
  if (existing != null) {
    existing.declarations.add(declarationMetadata);
    return existing.getter;
  }

  const getter = thunkFor(p, context);
  exportMap.imports.set(p, { getter, declarations: new Set([declarationMetadata]) });
  return getter;
}

export default class ExportMapBuilder {
  static get(source, context) {
    const path = resolve(source, context);
    if (path == null) { return null; }

    return ExportMapBuilder.for(childContext(path, context));
  }

  static for(context) {
    const { path } = context;

    const cacheKey = context.cacheKey || hashObject(context).digest('hex');
    let exportMap = exportCache.get(cacheKey);

    // return cached ignore
    if (exportMap === null) { return null; }

    const stats = fs.statSync(path);
    if (exportMap != null) {
      // date equality check
      if (exportMap.mtime - stats.mtime === 0) {
        return exportMap;
      }
      // future: check content equality?
    }

    // check valid extensions first
    if (!hasValidExtension(path, context)) {
      exportCache.set(cacheKey, null);
      return null;
    }

    // check for and cache ignore
    if (isIgnored(path, context)) {
      log('ignored path due to ignore settings:', path);
      exportCache.set(cacheKey, null);
      return null;
    }

    const content = fs.readFileSync(path, { encoding: 'utf8' });

    // check for and cache unambiguous modules
    if (!unambiguous.test(content)) {
      log('ignored path due to unambiguous regex:', path);
      exportCache.set(cacheKey, null);
      return null;
    }

    log('cache miss', cacheKey, 'for path', path);
    exportMap = ExportMapBuilder.parse(path, content, context);

    // ambiguous modules return null
    if (exportMap == null) {
      log('ignored path due to ambiguous parse:', path);
      exportCache.set(cacheKey, null);
      return null;
    }

    exportMap.mtime = stats.mtime;

    exportCache.set(cacheKey, exportMap);
    return exportMap;
  }

  static parse(path, content, context) {
    const exportMap = new ExportMap(path);
    const isEsModuleInteropTrue = isEsModuleInterop(context);

    let ast;
    let visitorKeys;
    try {
      const result = parse(path, content, context);
      ast = result.ast;
      visitorKeys = result.visitorKeys;
    } catch (err) {
      exportMap.errors.push(err);
      return exportMap; // can't continue
    }

    exportMap.visitorKeys = visitorKeys;

    let hasDynamicImports = false;

    const remotePathResolver = new RemotePath(path, context);

    function processDynamicImport(source) {
      hasDynamicImports = true;
      if (source.type !== 'Literal') {
        return null;
      }
      const p = remotePathResolver.resolve(source.value);
      if (p == null) {
        return null;
      }
      const importedSpecifiers = new Set();
      importedSpecifiers.add('ImportNamespaceSpecifier');
      const getter = thunkFor(p, context);
      exportMap.imports.set(p, {
        getter,
        declarations: new Set([{
          source: {
          // capturing actual node reference holds full AST in memory!
            value: source.value,
            loc: source.loc,
          },
          importedSpecifiers,
          dynamic: true,
        }]),
      });
    }

    visit(ast, visitorKeys, {
      ImportExpression(node) {
        processDynamicImport(node.source);
      },
      CallExpression(node) {
        if (node.callee.type === 'Import') {
          processDynamicImport(node.arguments[0]);
        }
      },
    });

    const unambiguouslyESM = unambiguous.isModule(ast);
    if (!unambiguouslyESM && !hasDynamicImports) { return null; }

    const docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];
    const docStyleParsers = {};
    docstyle.forEach((style) => {
      docStyleParsers[style] = availableDocStyleParsers[style];
    });

    // attempt to collect module doc
    if (ast.comments) {
      ast.comments.some((c) => {
        if (c.type !== 'Block') { return false; }
        try {
          const doc = doctrine.parse(c.value, { unwrap: true });
          if (doc.tags.some((t) => t.title === 'module')) {
            exportMap.doc = doc;
            return true;
          }
        } catch (err) { /* ignore */ }
        return false;
      });
    }

    const namespace = new Namespace(path, context, ExportMapBuilder);

    function captureDependencyWithSpecifiers(n) {
      // import type { Foo } (TS and Flow); import typeof { Foo } (Flow)
      const declarationIsType = n.importKind === 'type' || n.importKind === 'typeof';
      // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
      // shouldn't be considered to be just importing types
      let specifiersOnlyImportingTypes = n.specifiers.length > 0;
      const importedSpecifiers = new Set();
      n.specifiers.forEach((specifier) => {
        if (specifier.type === 'ImportSpecifier') {
          importedSpecifiers.add(specifier.imported.name || specifier.imported.value);
        } else if (supportedImportTypes.has(specifier.type)) {
          importedSpecifiers.add(specifier.type);
        }

        // import { type Foo } (Flow); import { typeof Foo } (Flow)
        specifiersOnlyImportingTypes = specifiersOnlyImportingTypes
          && (specifier.importKind === 'type' || specifier.importKind === 'typeof');
      });
      captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, remotePathResolver, exportMap, context, importedSpecifiers);
    }

    const source = makeSourceCode(content, ast);

    ast.body.forEach(function (astNode) {
      // This doesn't declare anything, but changes what's being exported.
      function typeScriptExport() {
        const exportedName = astNode.type === 'TSNamespaceExportDeclaration'
          ? (astNode.id || astNode.name).name
          : astNode.expression && astNode.expression.name || astNode.expression.id && astNode.expression.id.name || null;
        const declTypes = [
          'VariableDeclaration',
          'ClassDeclaration',
          'TSDeclareFunction',
          'TSEnumDeclaration',
          'TSTypeAliasDeclaration',
          'TSInterfaceDeclaration',
          'TSAbstractClassDeclaration',
          'TSModuleDeclaration',
        ];
        const exportedDecls = ast.body.filter(({ type, id, declarations }) => includes(declTypes, type) && (
          id && id.name === exportedName || declarations && declarations.find((d) => d.id.name === exportedName)
        ));
        if (exportedDecls.length === 0) {
          // Export is not referencing any local declaration, must be re-exporting
          exportMap.namespace.set('default', captureDoc(source, docStyleParsers, astNode));
          return;
        }
        if (
          isEsModuleInteropTrue // esModuleInterop is on in tsconfig
          && !exportMap.namespace.has('default') // and default isn't added already
        ) {
          exportMap.namespace.set('default', {}); // add default export
        }
        exportedDecls.forEach((decl) => {
          if (decl.type === 'TSModuleDeclaration') {
            if (decl.body && decl.body.type === 'TSModuleDeclaration') {
              exportMap.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));
            } else if (decl.body && decl.body.body) {
              decl.body.body.forEach((moduleBlockNode) => {
                // Export-assignment exports all members in the namespace,
                // explicitly exported or not.
                const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration'
                  ? moduleBlockNode.declaration
                  : moduleBlockNode;

                if (!namespaceDecl) {
                  // TypeScript can check this for us; we needn't
                } else if (namespaceDecl.type === 'VariableDeclaration') {
                  namespaceDecl.declarations.forEach((d) => recursivePatternCapture(d.id, (id) => exportMap.namespace.set(
                    id.name,
                    captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode),
                  )),
                  );
                } else {
                  exportMap.namespace.set(
                    namespaceDecl.id.name,
                    captureDoc(source, docStyleParsers, moduleBlockNode));
                }
              });
            }
          } else {
            // Export as default
            exportMap.namespace.set('default', captureDoc(source, docStyleParsers, decl));
          }
        });
      }

      const visitor = {
        ExportDefaultDeclaration() {
          const exportMeta = captureDoc(source, docStyleParsers, astNode);
          if (astNode.declaration.type === 'Identifier') {
            namespace.add(exportMeta, astNode.declaration);
          }
          exportMap.namespace.set('default', exportMeta);
        },
        ExportAllDeclaration() {
          const getter = captureDependency(astNode, astNode.exportKind === 'type', remotePathResolver, exportMap, context);
          if (getter) { exportMap.dependencies.add(getter); }
          if (astNode.exported) {
            processSpecifier(astNode, astNode.exported, exportMap, namespace);
          }
        },
        /** capture namespaces in case of later export */
        ImportDeclaration() {
          captureDependencyWithSpecifiers(astNode);
          const ns = astNode.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
          if (ns) {
            namespace.rawSet(ns.local.name, astNode.source.value);
          }
        },
        ExportNamedDeclaration() {
          captureDependencyWithSpecifiers(astNode);
          // capture declaration
          if (astNode.declaration != null) {
            switch (astNode.declaration.type) {
              case 'FunctionDeclaration':
              case 'ClassDeclaration':
              case 'TypeAlias': // flowtype with babel-eslint parser
              case 'InterfaceDeclaration':
              case 'DeclareFunction':
              case 'TSDeclareFunction':
              case 'TSEnumDeclaration':
              case 'TSTypeAliasDeclaration':
              case 'TSInterfaceDeclaration':
              case 'TSAbstractClassDeclaration':
              case 'TSModuleDeclaration':
                exportMap.namespace.set(astNode.declaration.id.name, captureDoc(source, docStyleParsers, astNode));
                break;
              case 'VariableDeclaration':
                astNode.declaration.declarations.forEach((d) => {
                  recursivePatternCapture(
                    d.id,
                    (id) => exportMap.namespace.set(id.name, captureDoc(source, docStyleParsers, d, astNode)),
                  );
                });
                break;
              default:
            }
          }
          astNode.specifiers.forEach((s) => processSpecifier(s, astNode, exportMap, namespace));
        },
        TSExportAssignment: typeScriptExport,
        ...isEsModuleInteropTrue && { TSNamespaceExportDeclaration: typeScriptExport },
      };

      if (visitor[astNode.type]) {
        visitor[astNode.type]();
      }
    });

    if (
      isEsModuleInteropTrue // esModuleInterop is on in tsconfig
      && exportMap.namespace.size > 0 // anything is exported
      && !exportMap.namespace.has('default') // and default isn't added already
    ) {
      exportMap.namespace.set('default', {}); // add default export
    }

    if (unambiguouslyESM) {
      exportMap.parseGoal = 'Module';
    }
    return exportMap;
  }
}
