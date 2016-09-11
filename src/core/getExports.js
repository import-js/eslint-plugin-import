import Map from 'es6-map'

import * as fs from 'fs'

import { createHash } from 'crypto'
import * as doctrine from 'doctrine'

import debug from 'debug'

import parse from './parse'
import resolve, { relative as resolveRelative } from './resolve'
import isIgnored, { hasValidExtension } from './ignore'

import { hashObject } from './hash'

const log = debug('eslint-plugin-import:ExportMap')

const exportCache = new Map()

/**
 * detect exports without a full parse.
 * used primarily to ignore the import/ignore setting, iif it looks like
 * there might be something there (i.e., jsnext:main is set).
 * @type {RegExp}
 */
const hasExports = new RegExp('(^|[\\n;])\\s*export\\s[\\w{*]')

export default class ExportMap {
  constructor(path) {
    this.path = path
    this.namespace = new Map()
    // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map()
    this.dependencies = new Map()
    this.errors = []
  }

  get hasDefault() { return this.get('default') != null } // stronger than this.has

  get size() {
    let size = this.namespace.size + this.reexports.size
    this.dependencies.forEach(dep => size += dep().size)
    return size
  }

  static get(source, context) {

    var path = resolve(source, context)
    if (path == null) return null

    return ExportMap.for(path, context)
  }

  static for(path, context) {
    let exportMap

    const cacheKey = hashObject(createHash('sha256'), {
      settings: context.settings,
      parserPath: context.parserPath,
      parserOptions: context.parserOptions,
      path,
    }).digest('hex')

    exportMap = exportCache.get(cacheKey)

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
    if (isIgnored(path, context) && !hasExports.test(content)) {
      exportCache.set(cacheKey, null)
      return null
    }

    exportMap = ExportMap.parse(path, content, context)
    exportMap.mtime = stats.mtime

    exportCache.set(cacheKey, exportMap)
    return exportMap
  }

  static parse(path, content, context) {
    var m = new ExportMap(path)

    try {
      var ast = parse(path, content, context)
    } catch (err) {
      log('parse error:', path, err)
      m.errors.push(err)
      return m // can't continue
    }

    const docstyle = (context.settings && context.settings['import/docstyle']) || ['jsdoc']
    const docStyleParsers = {}
    docstyle.forEach(style => {
      docStyleParsers[style] = availableDocStyleParsers[style]
    })

    // attempt to collect module doc
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

    const namespaces = new Map()

    function remotePath(node) {
      return resolveRelative(node.source.value, path, context.settings)
    }

    function resolveImport(node) {
      const rp = remotePath(node)
      if (rp == null) return null
      return ExportMap.for(rp, context)
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


    ast.body.forEach(function (n) {

      if (n.type === 'ExportDefaultDeclaration') {
        const exportMeta = captureDoc(docStyleParsers, n)
        if (n.declaration.type === 'Identifier') {
          addNamespace(exportMeta, n.declaration)
        }
        m.namespace.set('default', exportMeta)
        return
      }

      if (n.type === 'ExportAllDeclaration') {
        let remoteMap = remotePath(n)
        if (remoteMap == null) return
        m.dependencies.set(remoteMap, () => ExportMap.for(remoteMap, context))
        return
      }

      // capture namespaces in case of later export
      if (n.type === 'ImportDeclaration') {
        let ns
        if (n.specifiers.some(s => s.type === 'ImportNamespaceSpecifier' && (ns = s))) {
          namespaces.set(ns.local.name, n)
        }
        return
      }

      if (n.type === 'ExportNamedDeclaration'){
        // capture declaration
        if (n.declaration != null) {
          switch (n.declaration.type) {
            case 'FunctionDeclaration':
            case 'ClassDeclaration':
            case 'TypeAlias': // flowtype with babel-eslint parser
              m.namespace.set(n.declaration.id.name, captureDoc(docStyleParsers, n))
              break
            case 'VariableDeclaration':
              n.declaration.declarations.forEach((d) =>
                recursivePatternCapture(d.id, id =>
                  m.namespace.set(id.name, captureDoc(docStyleParsers, d, n))))
              break
          }
        }

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
                get() { return resolveImport(n) },
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
          m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(n) })
        })
      }
    })

    return m
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
    let foundInnerMapName = false
    if (name !== 'default') {
      this.dependencies.forEach((dep) => {
        if (!foundInnerMapName) {
          let innerMap = dep()

          // todo: report as unresolved?
          if (innerMap && innerMap.has(name)) foundInnerMapName = true
        }
      })
    }

    return foundInnerMapName
  }

  /**
   * ensure that imported name fully resolves.
   * @param  {[type]}  name [description]
   * @return {Boolean}      [description]
   */
  hasDeep(name) {
    if (this.namespace.has(name)) return { found: true, path: [this] }

    if (this.reexports.has(name)) {
      const { local, getImport } = this.reexports.get(name)
          , imported = getImport()

      // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] }

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && local === name) return { found: false, path: [this] }

      const deep = imported.hasDeep(local)
      deep.path.unshift(this)

      return deep
    }


    // default exports must be explicitly re-exported (#328)
    let returnValue = { found: false, path: [this] }
    if (name !== 'default') {
      this.dependencies.forEach((dep) => {
        if (!returnValue.found) {
          let innerMap = dep()
          // todo: report as unresolved?
          if (innerMap) {

            // safeguard against cycles
            if (innerMap.path !== this.path) {

              let innerValue = innerMap.hasDeep(name)
              if (innerValue.found) {
                innerValue.path.unshift(this)
                returnValue = innerValue
              }
            }
          }
        }
      })
    }

    return returnValue
  }

  get(name) {
    if (this.namespace.has(name)) return this.namespace.get(name)

    if (this.reexports.has(name)) {
      const { local, getImport } = this.reexports.get(name)
          , imported = getImport()

      // if import is ignored, return explicit 'null'
      if (imported == null) return null

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && local === name) return undefined

      return imported.get(local)
    }

    // default exports must be explicitly re-exported (#328)
    let returnValue = undefined
    if (name !== 'default') {
      this.dependencies.forEach((dep) => {
        if (returnValue === undefined) {
          let innerMap = dep()
          // todo: report as unresolved?
          if (innerMap) {

            // safeguard against cycles
            if (innerMap.path !== this.path) {

              let innerValue = innerMap.get(name)
              if (innerValue !== undefined) returnValue = innerValue
            }
          }
        }
      })
    }

    return returnValue
  }

  forEach(callback, thisArg) {
    this.namespace.forEach((v, n) =>
      callback.call(thisArg, v, n, this))

    this.reexports.forEach(({ getImport, local }, name) => {
      const reexported = getImport()
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(local), name, this)
    })

    this.dependencies.forEach(dep => dep().forEach((v, n) =>
      n !== 'default' && callback.call(thisArg, v, n, this)))
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
 * @param  {...[type]} nodes [description]
 * @return {{doc: object}}
 */
function captureDoc(docStyleParsers, ...nodes) {
  const metadata = {}

  // 'some' short-circuits on first 'true'
  nodes.some(n => {
    if (!n.leadingComments) return false

    for (let name in docStyleParsers) {
      const doc = docStyleParsers[name](n.leadingComments)
      if (doc) {
        metadata.doc = doc
      }
    }

    return true
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
    if (comment.value.slice(0, 4) !== '*\n *') return
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
      pattern.properties.forEach(({ value }) => {
        recursivePatternCapture(value, callback)
      })
      break

    case 'ArrayPattern':
      pattern.elements.forEach((element) => {
        if (element == null) return
        recursivePatternCapture(element, callback)
      })
      break
  }
}
