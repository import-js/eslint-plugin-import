import fs from 'fs';

import doctrine from 'doctrine';

import debug from 'debug';

import parse from 'eslint-module-utils/parse';
import visit from 'eslint-module-utils/visit';
import resolve from 'eslint-module-utils/resolve';
import isIgnored, { hasValidExtension } from 'eslint-module-utils/ignore';

import { hashObject } from 'eslint-module-utils/hash';
import * as unambiguous from 'eslint-module-utils/unambiguous';

import ExportMap from '.';
import childContext from './childContext';
import { isEsModuleInterop } from './typescript';
import { RemotePath } from './remotePath';
import ImportExportVisitorBuilder from './visitor';

const log = debug('eslint-plugin-import:ExportMap');

const exportCache = new Map();

/**
 * The creation of this closure is isolated from other scopes
 * to avoid over-retention of unrelated variables, which has
 * caused memory leaks. See #1266.
 */
function thunkFor(p, context) {
  // eslint-disable-next-line no-use-before-define
  return () => ExportMapBuilder.for(childContext(p, context));
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

    // If the visitor keys were not populated, then we shouldn't save anything to the cache,
    // since the parse results may not be reliable.
    if (exportMap.visitorKeys) {
      exportCache.set(cacheKey, exportMap);
    }
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

    const visitorBuilder = new ImportExportVisitorBuilder(
      path,
      context,
      exportMap,
      ExportMapBuilder,
      content,
      ast,
      isEsModuleInteropTrue,
      thunkFor,
    );
    ast.body.forEach(function (astNode) {
      const visitor = visitorBuilder.build(astNode);

      if (visitor[astNode.type]) {
        visitor[astNode.type].call(visitorBuilder);
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
