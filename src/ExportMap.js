import fs from 'fs'

import doctrine from 'doctrine'

import debug from 'debug'

import SourceCode from 'eslint/lib/util/source-code'

import parse from 'eslint-module-utils/parse'
import resolve from 'eslint-module-utils/resolve'
import isIgnored, { hasValidExtension } from 'eslint-module-utils/ignore'

import { hashObject } from 'eslint-module-utils/hash'
import * as unambiguous from 'eslint-module-utils/unambiguous'

const log = debug('eslint-plugin-import:ExportMap')

const exportCache = new Map()

export default class ExportMap {
  constructor(path) {
    this.path = path
    this.namespace = new Map()
    // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map()
    /**
     * star-exports
     * @type {Set} of () => ExportMap
     */
    this.dependencies = new Set()
    /**
     * dependencies of this module that are not explicitly re-exported
     * @type {Map} from path = () => ExportMap
     */
    this.imports = new Map()
    this.errors = []
  }

  get hasDefault() { return this.get('default') != null } // stronger than this.has

  get size() {
    let size = this.namespace.size + this.reexports.size
    this.dependencies.forEach(dep => {
      const d = dep()
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) return
      size += d.size
    })
    return size
  }

  /**
   * Note that this does not check explicitly re-exported names for existence
   * in the base namespace, but it will expand all `export * from '...'` exports
   * if not found in the explicit namespace.
   * @param  {string}  name
   * @return {Boolean} true if `name` is exported by this module.
   */
  has(name) {
    if (this.namespace.has(name)) return true
    if (this.reexports.has(name)) return true

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies) {
        let innerMap = dep()

        // todo: report as unresolved?
        if (!innerMap) continue

        if (innerMap.has(name)) return true
      }
    }

    return false
  }

  /**
   * ensure that imported name fully resolves.
   * @param  {[type]}  name [description]
   * @return {Boolean}      [description]
   */
  hasDeep(name) {
    if (this.namespace.has(name)) return { found: true, path: [this] }

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name)
          , imported = reexports.getImport()

      // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] }

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) {
        return { found: false, path: [this] }
      }

      const deep = imported.hasDeep(reexports.local)
      deep.path.unshift(this)

      return deep
    }


    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies) {
        let innerMap = dep()
        // todo: report as unresolved?
        if (!innerMap) continue

        // safeguard against cycles
        if (innerMap.path === this.path) continue

        let innerValue = innerMap.hasDeep(name)
        if (innerValue.found) {
          innerValue.path.unshift(this)
          return innerValue
        }
      }
    }

    return { found: false, path: [this] }
  }

  get(name) {
    if (this.namespace.has(name)) return this.namespace.get(name)

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name)
          , imported = reexports.getImport()

      // if import is ignored, return explicit 'null'
      if (imported == null) return null

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined

      return imported.get(reexports.local)
    }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies) {
        let innerMap = dep()
        // todo: report as unresolved?
        if (!innerMap) continue

        // safeguard against cycles
        if (innerMap.path === this.path) continue

        let innerValue = innerMap.get(name)
        if (innerValue !== undefined) return innerValue
      }
    }

    return undefined
  }

  forEach(callback, thisArg) {
    this.namespace.forEach((v, n) =>
      callback.call(thisArg, v, n, this))

    this.reexports.forEach((reexports, name) => {
      const reexported = reexports.getImport()
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this)
    })

    this.dependencies.forEach(dep => {
      const d = dep()
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) return

      d.forEach((v, n) =>
        n !== 'default' && callback.call(thisArg, v, n, this))
    })
  }

  // todo: keys, values, entries?

  reportErrors(context, declaration) {
    context.report({
      node: declaration.source,
      message: `Parse errors in imported module '${declaration.source.value}': ` +
                  `${this.errors
                        .map(e => `${e.message} (${e.lineNumber}:${e.column})`)
                        .join(', ')}`,
    })
  }
}

/**
 * parse docs from the first node that has leading comments
 */
function captureDoc(source, docStyleParsers, ...nodes) {
  const metadata = {}

  // 'some' short-circuits on first 'true'
  nodes.some(n => {
    try {

      let leadingComments

      // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {
        leadingComments = n.leadingComments
      } else if (n.range) {
        leadingComments = source.getCommentsBefore(n)
      }

      if (!leadingComments || leadingComments.length === 0) return false

      for (let name in docStyleParsers) {
        const doc = docStyleParsers[name](leadingComments)
        if (doc) {
          metadata.doc = doc
        }
      }

      return true
    } catch (err) {
      return false
    }
  })

  return metadata
}

const availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc,
}

/**
 * parse JSDoc from leading comments
 * @param  {...[type]} comments [description]
 * @return {{doc: object}}
 */
function captureJsDoc(comments) {
  let doc

  // capture XSDoc
  comments.forEach(comment => {
    // skip non-block comments
    if (comment.type !== 'Block') return
    try {
      doc = doctrine.parse(comment.value, { unwrap: true })
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  })

  return doc
}

/**
  * parse TomDoc section from comments
  */
function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  const lines = []
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i]
    if (comment.value.match(/^\s*$/)) break
    lines.push(comment.value.trim())
  }

  // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/)
  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2],
      }],
    }
  }
}

ExportMap.get = function (source, context) {
  const path = resolve(source, context)
  if (path == null) return null

  return ExportMap.for(childContext(path, context))
}

ExportMap.for = function (context) {
  const { path } = context

  const cacheKey = hashObject(context).digest('hex')
  let exportMap = exportCache.get(cacheKey)

  // return cached ignore
  if (exportMap === null) return null

  const stats = fs.statSync(path)
  if (exportMap != null) {
    // date equality check
    if (exportMap.mtime - stats.mtime === 0) {
      return exportMap
    }
    // future: check content equality?
  }

  // check valid extensions first
  if (!hasValidExtension(path, context)) {
    exportCache.set(cacheKey, null)
    return null
  }

  const content = fs.readFileSync(path, { encoding: 'utf8' })

  // check for and cache ignore
  if (isIgnored(path, context) || !unambiguous.test(content)) {
    log('ignored path due to unambiguous regex or ignore settings:', path)
    exportCache.set(cacheKey, null)
    return null
  }

  log('cache miss', cacheKey, 'for path', path)
  exportMap = ExportMap.parse(path, content, context)

  // ambiguous modules return null
  if (exportMap == null) return null

  exportMap.mtime = stats.mtime

  exportCache.set(cacheKey, exportMap)
  return exportMap
}


ExportMap.parse = function (path, content, context) {
  var m = new ExportMap(path)

  try {
    var ast = parse(path, content, context)
  } catch (err) {
    log('parse error:', path, err)
    m.errors.push(err)
    return m // can't continue
  }

  if (!unambiguous.isModule(ast)) return null

  const docstyle = (context.settings && context.settings['import/docstyle']) || ['jsdoc']
  const docStyleParsers = {}
  docstyle.forEach(style => {
    docStyleParsers[style] = availableDocStyleParsers[style]
  })

  // attempt to collect module doc
  if (ast.comments) {
    ast.comments.some(c => {
      if (c.type !== 'Block') return false
      try {
        const doc = doctrine.parse(c.value, { unwrap: true })
        if (doc.tags.some(t => t.title === 'module')) {
          m.doc = doc
          return true
        }
      } catch (err) { /* ignore */ }
      return false
    })
  }

  const namespaces = new Map()

  function remotePath(value) {
    return resolve.relative(value, path, context.settings)
  }

  function resolveImport(value) {
    const rp = remotePath(value)
    if (rp == null) return null
    return ExportMap.for(childContext(rp, context))
  }

  function getNamespace(identifier) {
    if (!namespaces.has(identifier.name)) return

    return function () {
      return resolveImport(namespaces.get(identifier.name))
    }
  }

  function addNamespace(object, identifier) {
    const nsfn = getNamespace(identifier)
    if (nsfn) {
      Object.defineProperty(object, 'namespace', { get: nsfn })
    }

    return object
  }

  function captureDependency(declaration) {
    if (declaration.source == null) return null
    const importedSpecifiers = new Set()
    const supportedTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier'])
    if (declaration.specifiers) {
      declaration.specifiers.forEach(specifier => {
        if (supportedTypes.has(specifier.type)) {
          importedSpecifiers.add(specifier.type)
        }
        if (specifier.type === 'ImportSpecifier') {
          importedSpecifiers.add(specifier.local.name)
        }
      })
    }

    const p = remotePath(declaration.source.value)
    if (p == null) return null
    const existing = m.imports.get(p)
    if (existing != null) return existing.getter

    const getter = thunkFor(p, context)
    m.imports.set(p, {
      getter,
      source: {  // capturing actual node reference holds full AST in memory!
        value: declaration.source.value,
        loc: declaration.source.loc,
      },
      importedSpecifiers,
    })
    return getter
  }

  const source = makeSourceCode(content, ast)

  ast.body.forEach(function (n) {

    if (n.type === 'ExportDefaultDeclaration') {
      const exportMeta = captureDoc(source, docStyleParsers, n)
      if (n.declaration.type === 'Identifier') {
        addNamespace(exportMeta, n.declaration)
      }
      m.namespace.set('default', exportMeta)
      return
    }

    if (n.type === 'ExportAllDeclaration') {
      const getter = captureDependency(n)
      if (getter) m.dependencies.add(getter)
      return
    }

    // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {
      captureDependency(n)
      let ns
      if (n.specifiers.some(s => s.type === 'ImportNamespaceSpecifier' && (ns = s))) {
        namespaces.set(ns.local.name, n.source.value)
      }
      return
    }

    if (n.type === 'ExportNamedDeclaration') {
      // capture declaration
      if (n.declaration != null) {
        switch (n.declaration.type) {
          case 'FunctionDeclaration':
          case 'ClassDeclaration':
          case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':
          case 'TSEnumDeclaration':
          case 'TSTypeAliasDeclaration':
          case 'TSInterfaceDeclaration':
          case 'TSAbstractClassDeclaration':
          case 'TSModuleDeclaration':
            m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n))
            break
          case 'VariableDeclaration':
            n.declaration.declarations.forEach((d) =>
              recursivePatternCapture(d.id,
                id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n))))
            break
        }
      }

      const nsource = n.source && n.source.value
      n.specifiers.forEach((s) => {
        const exportMeta = {}
        let local

        switch (s.type) {
          case 'ExportDefaultSpecifier':
            if (!n.source) return
            local = 'default'
            break
          case 'ExportNamespaceSpecifier':
            m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
              get() { return resolveImport(nsource) },
            }))
            return
          case 'ExportSpecifier':
            if (!n.source) {
              m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local))
              return
            }
            // else falls through
          default:
            local = s.local.name
            break
        }

        // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) })
      })
    }
  })

  return m
}

/**
 * The creation of this closure is isolated from other scopes
 * to avoid over-retention of unrelated variables, which has
 * caused memory leaks. See #1266.
 */
function thunkFor(p, context) {
  return () => ExportMap.for(childContext(p, context))
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
      callback(pattern)
      break

    case 'ObjectPattern':
      pattern.properties.forEach(p => {
        recursivePatternCapture(p.value, callback)
      })
      break

    case 'ArrayPattern':
      pattern.elements.forEach((element) => {
        if (element == null) return
        recursivePatternCapture(element, callback)
      })
      break

    case 'AssignmentPattern':
      callback(pattern.left)
      break
  }
}

/**
 * don't hold full context object in memory, just grab what we need.
 */
function childContext(path, context) {
  const { settings, parserOptions, parserPath } = context
  return {
    settings,
    parserOptions,
    parserPath,
    path,
  }
}


/**
 * sometimes legacy support isn't _that_ hard... right?
 */
function makeSourceCode(text, ast) {
  if (SourceCode.length > 1) {
    // ESLint 3
    return new SourceCode(text, ast)
  } else {
    // ESLint 4, 5
    return new SourceCode({ text, ast })
  }
}
