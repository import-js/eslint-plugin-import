import fs from 'fs';

import doctrine from 'doctrine';

import debug from 'debug';

import { SourceCode } from 'eslint';

import parse from 'eslint-module-utils/parse';
import resolve from 'eslint-module-utils/resolve';
import isIgnored, { hasValidExtension } from 'eslint-module-utils/ignore';

import { hashObject } from 'eslint-module-utils/hash';
import * as unambiguous from 'eslint-module-utils/unambiguous';

import { tsConfigLoader } from 'tsconfig-paths/lib/tsconfig-loader';

import includes from 'array-includes';

let parseConfigFileTextToJson;

const log = debug('eslint-plugin-import:ExportMap');

const exportCache = new Map();
const tsConfigCache = new Map();

export default class ExportMap {
  constructor(path) {
    this.path = path;
    this.namespace = new Map();
    // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map();
    /**
     * star-exports
     * @type {Set} of () => ExportMap
     */
    this.dependencies = new Set();
    /**
     * dependencies of this module that are not explicitly re-exported
     * @type {Map} from path = () => ExportMap
     */
    this.imports = new Map();
    this.errors = [];
  }

  get hasDefault() { return this.get('default') != null; } // stronger than this.has

  get size() {
    let size = this.namespace.size + this.reexports.size;
    this.dependencies.forEach(dep => {
      const d = dep();
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;
      size += d.size;
    });
    return size;
  }

  /**
   * Note that this does not check explicitly re-exported names for existence
   * in the base namespace, but it will expand all `export * from '...'` exports
   * if not found in the explicit namespace.
   * @param  {string}  name
   * @return {Boolean} true if `name` is exported by this module.
   */
  has(name) {
    if (this.namespace.has(name)) return true;
    if (this.reexports.has(name)) return true;

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (const dep of this.dependencies) {
        const innerMap = dep();

        // todo: report as unresolved?
        if (!innerMap) continue;

        if (innerMap.has(name)) return true;
      }
    }

    return false;
  }

  /**
   * ensure that imported name fully resolves.
   * @param  {string} name
   * @return {{ found: boolean, path: ExportMap[] }}
   */
  hasDeep(name) {
    if (this.namespace.has(name)) return { found: true, path: [this] };

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name);
      const imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] };

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) {
        return { found: false, path: [this] };
      }

      const deep = imported.hasDeep(reexports.local);
      deep.path.unshift(this);

      return deep;
    }


    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (const dep of this.dependencies) {
        const innerMap = dep();
        if (innerMap == null) return { found: true, path: [this] };
        // todo: report as unresolved?
        if (!innerMap) continue;

        // safeguard against cycles
        if (innerMap.path === this.path) continue;

        const innerValue = innerMap.hasDeep(name);
        if (innerValue.found) {
          innerValue.path.unshift(this);
          return innerValue;
        }
      }
    }

    return { found: false, path: [this] };
  }

  get(name) {
    if (this.namespace.has(name)) return this.namespace.get(name);

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name);
      const imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return null;

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined;

      return imported.get(reexports.local);
    }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (const dep of this.dependencies) {
        const innerMap = dep();
        // todo: report as unresolved?
        if (!innerMap) continue;

        // safeguard against cycles
        if (innerMap.path === this.path) continue;

        const innerValue = innerMap.get(name);
        if (innerValue !== undefined) return innerValue;
      }
    }

    return undefined;
  }

  forEach(callback, thisArg) {
    this.namespace.forEach((v, n) =>
      callback.call(thisArg, v, n, this));

    this.reexports.forEach((reexports, name) => {
      const reexported = reexports.getImport();
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);
    });

    this.dependencies.forEach(dep => {
      const d = dep();
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;

      d.forEach((v, n) =>
        n !== 'default' && callback.call(thisArg, v, n, this));
    });
  }

  // todo: keys, values, entries?

  reportErrors(context, declaration) {
    context.report({
      node: declaration.source,
      message: `Parse errors in imported module '${declaration.source.value}': ` +
                  `${this.errors
                    .map(e => `${e.message} (${e.lineNumber}:${e.column})`)
                    .join(', ')}`,
    });
  }
}

/**
 * parse docs from the first node that has leading comments
 */
function captureDoc(source, docStyleParsers, ...nodes) {
  const metadata = {};

  // 'some' short-circuits on first 'true'
  nodes.some(n => {
    try {

      let leadingComments;

      // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {
        leadingComments = n.leadingComments;
      } else if (n.range) {
        leadingComments = source.getCommentsBefore(n);
      }

      if (!leadingComments || leadingComments.length === 0) return false;

      for (const name in docStyleParsers) {
        const doc = docStyleParsers[name](leadingComments);
        if (doc) {
          metadata.doc = doc;
        }
      }

      return true;
    } catch (err) {
      return false;
    }
  });

  return metadata;
}

const availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc,
};

/**
 * parse JSDoc from leading comments
 * @param {object[]} comments
 * @return {{ doc: object }}
 */
function captureJsDoc(comments) {
  let doc;

  // capture XSDoc
  comments.forEach(comment => {
    // skip non-block comments
    if (comment.type !== 'Block') return;
    try {
      doc = doctrine.parse(comment.value, { unwrap: true });
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  });

  return doc;
}

/**
  * parse TomDoc section from comments
  */
function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  const lines = [];
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment.value.match(/^\s*$/)) break;
    lines.push(comment.value.trim());
  }

  // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);
  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2],
      }],
    };
  }
}

const supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);

ExportMap.get = function (source, context) {
  const path = resolve(source, context);
  if (path == null) return null;

  return ExportMap.for(childContext(path, context));
};

ExportMap.for = function (context) {
  const { path } = context;

  const cacheKey = hashObject(context).digest('hex');
  let exportMap = exportCache.get(cacheKey);

  // return cached ignore
  if (exportMap === null) return null;

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
  exportMap = ExportMap.parse(path, content, context);

  // ambiguous modules return null
  if (exportMap == null) return null;

  exportMap.mtime = stats.mtime;

  exportCache.set(cacheKey, exportMap);
  return exportMap;
};


ExportMap.parse = function (path, content, context) {
  const m = new ExportMap(path);

  let ast;
  try {
    ast = parse(path, content, context);
  } catch (err) {
    log('parse error:', path, err);
    m.errors.push(err);
    return m; // can't continue
  }

  if (!unambiguous.isModule(ast)) return null;

  const docstyle = (context.settings && context.settings['import/docstyle']) || ['jsdoc'];
  const docStyleParsers = {};
  docstyle.forEach(style => {
    docStyleParsers[style] = availableDocStyleParsers[style];
  });

  // attempt to collect module doc
  if (ast.comments) {
    ast.comments.some(c => {
      if (c.type !== 'Block') return false;
      try {
        const doc = doctrine.parse(c.value, { unwrap: true });
        if (doc.tags.some(t => t.title === 'module')) {
          m.doc = doc;
          return true;
        }
      } catch (err) { /* ignore */ }
      return false;
    });
  }

  const namespaces = new Map();

  function remotePath(value) {
    const file = resolve.relative(value, path, context.settings);
    try {
      return file && fs.realpathSync(file);
    } catch (e) {
      return file;
    }
  }

  function resolveImport(value) {
    const rp = remotePath(value);
    if (rp == null) return null;
    return ExportMap.for(childContext(rp, context));
  }

  function getNamespace(identifier) {
    if (!namespaces.has(identifier.name)) return;

    return function () {
      return resolveImport(namespaces.get(identifier.name));
    };
  }

  function addNamespace(object, identifier) {
    const nsfn = getNamespace(identifier);
    if (nsfn) {
      Object.defineProperty(object, 'namespace', { get: nsfn });
    }

    return object;
  }

  function captureDependency({ source }, isOnlyImportingTypes, importedSpecifiers = new Set()) {
    if (source == null) return null;

    const p = remotePath(source.value);
    if (p == null) return null;

    const declarationMetadata = {
      // capturing actual node reference holds full AST in memory!
      source: { value: source.value, loc: source.loc },
      isOnlyImportingTypes,
      importedSpecifiers,
    };

    const existing = m.imports.get(p);
    if (existing != null) {
      existing.declarations.add(declarationMetadata);
      return existing.getter;
    }

    const getter = thunkFor(p, context);
    m.imports.set(p, { getter, declarations: new Set([declarationMetadata]) });
    return getter;
  }

  const source = makeSourceCode(content, ast);

  function readTsConfig() {
    const tsConfigInfo = tsConfigLoader({
      cwd:
        (context.parserOptions && context.parserOptions.tsconfigRootDir) ||
        process.cwd(),
      getEnv: (key) => process.env[key],
    });
    try {
      if (tsConfigInfo.tsConfigPath !== undefined) {
        const jsonText = fs.readFileSync(tsConfigInfo.tsConfigPath).toString();
        if (!parseConfigFileTextToJson) {
          // this is because projects not using TypeScript won't have typescript installed
          ({ parseConfigFileTextToJson } = require('typescript'));
        }
        return parseConfigFileTextToJson(tsConfigInfo.tsConfigPath, jsonText).config;
      }
    } catch (e) {
      // Catch any errors
    }

    return null;
  }

  function isEsModuleInterop() {
    const cacheKey = hashObject({
      tsconfigRootDir: context.parserOptions && context.parserOptions.tsconfigRootDir,
    }).digest('hex');
    let tsConfig = tsConfigCache.get(cacheKey);
    if (typeof tsConfig === 'undefined') {
      tsConfig = readTsConfig();
      tsConfigCache.set(cacheKey, tsConfig);
    }

    return tsConfig && tsConfig.compilerOptions ? tsConfig.compilerOptions.esModuleInterop : false;
  }

  ast.body.forEach(function (n) {
    if (n.type === 'ExportDefaultDeclaration') {
      const exportMeta = captureDoc(source, docStyleParsers, n);
      if (n.declaration.type === 'Identifier') {
        addNamespace(exportMeta, n.declaration);
      }
      m.namespace.set('default', exportMeta);
      return;
    }

    if (n.type === 'ExportAllDeclaration') {
      const getter = captureDependency(n, n.exportKind === 'type');
      if (getter) m.dependencies.add(getter);
      return;
    }

    // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {
      // import type { Foo } (TS and Flow)
      const declarationIsType = n.importKind === 'type';
      // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
      // shouldn't be considered to be just importing types
      let specifiersOnlyImportingTypes = n.specifiers.length;
      const importedSpecifiers = new Set();
      n.specifiers.forEach(specifier => {
        if (supportedImportTypes.has(specifier.type)) {
          importedSpecifiers.add(specifier.type);
        }
        if (specifier.type === 'ImportSpecifier') {
          importedSpecifiers.add(specifier.imported.name);
        }

        // import { type Foo } (Flow)
        specifiersOnlyImportingTypes =
          specifiersOnlyImportingTypes && specifier.importKind === 'type';
      });
      captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, importedSpecifiers);

      const ns = n.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');
      if (ns) {
        namespaces.set(ns.local.name, n.source.value);
      }
      return;
    }

    if (n.type === 'ExportNamedDeclaration') {
      // capture declaration
      if (n.declaration != null) {
        switch (n.declaration.type) {
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
          m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));
          break;
        case 'VariableDeclaration':
          n.declaration.declarations.forEach((d) =>
            recursivePatternCapture(d.id,
              id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n))));
          break;
        }
      }

      const nsource = n.source && n.source.value;
      n.specifiers.forEach((s) => {
        const exportMeta = {};
        let local;

        switch (s.type) {
        case 'ExportDefaultSpecifier':
          if (!n.source) return;
          local = 'default';
          break;
        case 'ExportNamespaceSpecifier':
          m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
            get() { return resolveImport(nsource); },
          }));
          return;
        case 'ExportSpecifier':
          if (!n.source) {
            m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));
            return;
          }
          // else falls through
        default:
          local = s.local.name;
          break;
        }

        // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) });
      });
    }

    const isEsModuleInteropTrue = isEsModuleInterop();

    const exports = ['TSExportAssignment'];
    if (isEsModuleInteropTrue) {
      exports.push('TSNamespaceExportDeclaration');
    }

    // This doesn't declare anything, but changes what's being exported.
    if (includes(exports, n.type)) {
      const exportedName = n.type === 'TSNamespaceExportDeclaration'
        ? n.id.name
        : (n.expression && n.expression.name || (n.expression.id && n.expression.id.name) || null);
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
        (id && id.name === exportedName) || (declarations && declarations.find((d) => d.id.name === exportedName))
      ));
      if (exportedDecls.length === 0) {
        // Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));
        return;
      }
      if (isEsModuleInteropTrue) {
        m.namespace.set('default', {});
      }
      exportedDecls.forEach((decl) => {
        if (decl.type === 'TSModuleDeclaration') {
          if (decl.body && decl.body.type === 'TSModuleDeclaration') {
            m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));
          } else if (decl.body && decl.body.body) {
            decl.body.body.forEach((moduleBlockNode) => {
              // Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ?
                moduleBlockNode.declaration :
                moduleBlockNode;

              if (!namespaceDecl) {
                // TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {
                namespaceDecl.declarations.forEach((d) =>
                  recursivePatternCapture(d.id, (id) => m.namespace.set(
                    id.name,
                    captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode),
                  )),
                );
              } else {
                m.namespace.set(
                  namespaceDecl.id.name,
                  captureDoc(source, docStyleParsers, moduleBlockNode));
              }
            });
          }
        } else {
          // Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));
        }
      });
    }
  });

  return m;
};

/**
 * The creation of this closure is isolated from other scopes
 * to avoid over-retention of unrelated variables, which has
 * caused memory leaks. See #1266.
 */
function thunkFor(p, context) {
  return () => ExportMap.for(childContext(p, context));
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
    pattern.properties.forEach(p => {
      if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {
        callback(p.argument);
        return;
      }
      recursivePatternCapture(p.value, callback);
    });
    break;

  case 'ArrayPattern':
    pattern.elements.forEach((element) => {
      if (element == null) return;
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
  }
}

/**
 * don't hold full context object in memory, just grab what we need.
 */
function childContext(path, context) {
  const { settings, parserOptions, parserPath } = context;
  return {
    settings,
    parserOptions,
    parserPath,
    path,
  };
}


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
