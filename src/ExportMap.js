import fs from 'fs';
import { resolve as pathResolve } from 'path';

import doctrine from 'doctrine';

import debug from 'debug';

import { SourceCode } from 'eslint';

import parse from 'eslint-module-utils/parse';
import visit from 'eslint-module-utils/visit';
import resolve from 'eslint-module-utils/resolve';
import isIgnored, { hasValidExtension } from 'eslint-module-utils/ignore';

import { hashObject } from 'eslint-module-utils/hash';
import * as unambiguous from 'eslint-module-utils/unambiguous';

import { getTsconfig } from 'get-tsconfig';

const includes = Function.bind.bind(Function.prototype.call)(Array.prototype.includes);

const log = debug('eslint-plugin-import:ExportMap');

const exportCache = new Map();
const tsconfigCache = new Map();

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
    /**
     * type {'ambiguous' | 'Module' | 'Script'}
     */
    this.parseGoal = 'ambiguous';
  }

  get hasDefault() { return this.get('default') != null; } // stronger than this.has

  get size() {
    let size = this.namespace.size + this.reexports.size;
    this.dependencies.forEach((dep) => {
      const d = dep();
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) { return; }
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
    if (this.namespace.has(name)) { return true; }
    if (this.reexports.has(name)) { return true; }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (const dep of this.dependencies) {
        const innerMap = dep();

        // todo: report as unresolved?
        if (!innerMap) { continue; }

        if (innerMap.has(name)) { return true; }
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
    if (this.namespace.has(name)) { return { found: true, path: [this] }; }

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name);
      const imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) { return { found: true, path: [this] }; }

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
        if (innerMap == null) { return { found: true, path: [this] }; }
        // todo: report as unresolved?
        if (!innerMap) { continue; }

        // safeguard against cycles
        if (innerMap.path === this.path) { continue; }

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
    if (this.namespace.has(name)) { return this.namespace.get(name); }

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name);
      const imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) { return null; }

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) { return undefined; }

      return imported.get(reexports.local);
    }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (const dep of this.dependencies) {
        const innerMap = dep();
        // todo: report as unresolved?
        if (!innerMap) { continue; }

        // safeguard against cycles
        if (innerMap.path === this.path) { continue; }

        const innerValue = innerMap.get(name);
        if (innerValue !== undefined) { return innerValue; }
      }
    }

    return undefined;
  }

  forEach(callback, thisArg) {
    this.namespace.forEach((v, n) => { callback.call(thisArg, v, n, this); });

    this.reexports.forEach((reexports, name) => {
      const reexported = reexports.getImport();
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);
    });

    this.dependencies.forEach((dep) => {
      const d = dep();
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) { return; }

      d.forEach((v, n) => {
        if (n !== 'default') {
          callback.call(thisArg, v, n, this);
        }
      });
    });
  }

  // todo: keys, values, entries?

  reportErrors(context, declaration) {
    const msg = this.errors
      .map((e) => `${e.message} (${e.lineNumber}:${e.column})`)
      .join(', ');
    context.report({
      node: declaration.source,
      message: `Parse errors in imported module '${declaration.source.value}': ${msg}`,
    });
  }
}

/**
 * parse docs from the first node that has leading comments
 */
function captureDoc(source, docStyleParsers, ...nodes) {
  const metadata = {};

  // 'some' short-circuits on first 'true'
  nodes.some((n) => {
    try {

      let leadingComments;

      // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {
        leadingComments = n.leadingComments;
      } else if (n.range) {
        leadingComments = source.getCommentsBefore(n);
      }

      if (!leadingComments || leadingComments.length === 0) { return false; }

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
  comments.forEach((comment) => {
    // skip non-block comments
    if (comment.type !== 'Block') { return; }
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
    if (comment.value.match(/^\s*$/)) { break; }
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
  if (path == null) { return null; }

  return ExportMap.for(childContext(path, context));
};

ExportMap.for = function (context) {
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
  exportMap = ExportMap.parse(path, content, context);

  // ambiguous modules return null
  if (exportMap == null) {
    log('ignored path due to ambiguous parse:', path);
    exportCache.set(cacheKey, null);
    return null;
  }

  exportMap.mtime = stats.mtime;

  exportCache.set(cacheKey, exportMap);
  return exportMap;
};

ExportMap.parse = function (path, content, context) {
  const m = new ExportMap(path);
  const isEsModuleInteropTrue = isEsModuleInterop();

  let ast;
  let visitorKeys;
  try {
    const result = parse(path, content, context);
    ast = result.ast;
    visitorKeys = result.visitorKeys;
  } catch (err) {
    m.errors.push(err);
    return m; // can't continue
  }

  m.visitorKeys = visitorKeys;

  let hasDynamicImports = false;

  function processDynamicImport(source) {
    hasDynamicImports = true;
    if (source.type !== 'Literal') {
      return null;
    }
    const p = remotePath(source.value);
    if (p == null) {
      return null;
    }
    const importedSpecifiers = new Set();
    importedSpecifiers.add('ImportNamespaceSpecifier');
    const getter = thunkFor(p, context);
    m.imports.set(p, {
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
          m.doc = doc;
          return true;
        }
      } catch (err) { /* ignore */ }
      return false;
    });
  }

  const namespaces = new Map();

  function remotePath(value) {
    return resolve.relative(value, path, context.settings);
  }

  function resolveImport(value) {
    const rp = remotePath(value);
    if (rp == null) { return null; }
    return ExportMap.for(childContext(rp, context));
  }

  function getNamespace(identifier) {
    if (!namespaces.has(identifier.name)) { return; }

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

  function processSpecifier(s, n, m) {
    const nsource = n.source && n.source.value;
    const exportMeta = {};
    let local;

    switch (s.type) {
      case 'ExportDefaultSpecifier':
        if (!nsource) { return; }
        local = 'default';
        break;
      case 'ExportNamespaceSpecifier':
        m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
          get() { return resolveImport(nsource); },
        }));
        return;
      case 'ExportAllDeclaration':
        m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.source.value));
        return;
      case 'ExportSpecifier':
        if (!n.source) {
          m.namespace.set(s.exported.name || s.exported.value, addNamespace(exportMeta, s.local));
          return;
        }
      // else falls through
      default:
        local = s.local.name;
        break;
    }

    // todo: JSDoc
    m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) });
  }

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
    captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, importedSpecifiers);
  }

  function captureDependency({ source }, isOnlyImportingTypes, importedSpecifiers = new Set()) {
    if (source == null) { return null; }

    const p = remotePath(source.value);
    if (p == null) { return null; }

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

  function isEsModuleInterop() {
    const parserOptions = context.parserOptions || {};
    let tsconfigRootDir = parserOptions.tsconfigRootDir;
    const project = parserOptions.project;
    const cacheKey = hashObject({
      tsconfigRootDir,
      project,
    }).digest('hex');
    let tsConfig = tsconfigCache.get(cacheKey);
    if (typeof tsConfig === 'undefined') {
      tsconfigRootDir = tsconfigRootDir || process.cwd();
      let tsconfigResult;
      if (project) {
        const projects = Array.isArray(project) ? project : [project];
        for (const project of projects) {
          tsconfigResult = getTsconfig(project === true ? context.filename : pathResolve(tsconfigRootDir, project));
          if (tsconfigResult) {
            break;
          }
        }
      } else {
        tsconfigResult = getTsconfig(tsconfigRootDir);
      }
      tsConfig = tsconfigResult && tsconfigResult.config || null;
      tsconfigCache.set(cacheKey, tsConfig);
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
      if (getter) { m.dependencies.add(getter); }
      if (n.exported) {
        processSpecifier(n, n.exported, m);
      }
      return;
    }

    // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {
      captureDependencyWithSpecifiers(n);

      const ns = n.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
      if (ns) {
        namespaces.set(ns.local.name, n.source.value);
      }
      return;
    }

    if (n.type === 'ExportNamedDeclaration') {
      captureDependencyWithSpecifiers(n);

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
            n.declaration.declarations.forEach((d) => {
              recursivePatternCapture(
                d.id,
                (id) => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n)),
              );
            });
            break;
          default:
        }
      }

      n.specifiers.forEach((s) => processSpecifier(s, n, m));
    }

    const exports = ['TSExportAssignment'];
    if (isEsModuleInteropTrue) {
      exports.push('TSNamespaceExportDeclaration');
    }

    // This doesn't declare anything, but changes what's being exported.
    if (includes(exports, n.type)) {
      const exportedName = n.type === 'TSNamespaceExportDeclaration'
        ? (n.id || n.name).name
        : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;
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
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));
        return;
      }
      if (
        isEsModuleInteropTrue // esModuleInterop is on in tsconfig
        && !m.namespace.has('default') // and default isn't added already
      ) {
        m.namespace.set('default', {}); // add default export
      }
      exportedDecls.forEach((decl) => {
        if (decl.type === 'TSModuleDeclaration') {
          if (decl.body && decl.body.type === 'TSModuleDeclaration') {
            m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));
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
                namespaceDecl.declarations.forEach((d) => recursivePatternCapture(d.id, (id) => m.namespace.set(
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

  if (
    isEsModuleInteropTrue // esModuleInterop is on in tsconfig
    && m.namespace.size > 0 // anything is exported
    && !m.namespace.has('default') // and default isn't added already
  ) {
    m.namespace.set('default', {}); // add default export
  }

  if (unambiguouslyESM) {
    m.parseGoal = 'Module';
  }
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

let parserOptionsHash = '';
let prevParserOptions = '';
let settingsHash = '';
let prevSettings = '';
/**
 * don't hold full context object in memory, just grab what we need.
 * also calculate a cacheKey, where parts of the cacheKey hash are memoized
 */
function childContext(path, context) {
  const { settings, parserOptions, parserPath } = context;

  if (JSON.stringify(settings) !== prevSettings) {
    settingsHash = hashObject({ settings }).digest('hex');
    prevSettings = JSON.stringify(settings);
  }

  if (JSON.stringify(parserOptions) !== prevParserOptions) {
    parserOptionsHash = hashObject({ parserOptions }).digest('hex');
    prevParserOptions = JSON.stringify(parserOptions);
  }

  return {
    cacheKey: String(parserPath) + parserOptionsHash + settingsHash + String(path),
    settings,
    parserOptions,
    parserPath,
    path,
    filename: typeof context.getPhysicalFilename === 'function'
      ? context.getPhysicalFilename()
      : context.physicalFilename != null
        ? context.physicalFilename
        : typeof context.getFilename === 'function'
          ? context.getFilename()
          : context.filename,
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
