import * as fs from 'fs'

import { createHash } from 'crypto'
import * as doctrine from 'doctrine'

import parse from './parse'
import resolve from './resolve'
import isIgnored from './ignore'

// map from settings sha1 => path => export map objects
const exportCaches = new Map()

export default class ExportMap {
  constructor() {
    this.namespace = new Map()
    this.reexports = new Map()
    this.dependencies = new Map()
    this.errors = []
  }

  /**
   * @deprecated use ExportMap directly
   * @return {Map}
   */
  get named() { return this }
  get hasDefault() { return this.has('default') }

  /**
   * @deprecated too expensive, and unneccesary
   * @return {Boolean} [description]
   */
  get hasNamed() { return this.namespace.size > (this.hasDefault ? 1 : 0) }

  static get(source, context) {

    var path = resolve(source, context)
    if (path == null) return null

    return ExportMap.for(path, context)
  }

  static for(path, context) {
    let exportMap

    const cacheKey = hashObject({
      settings: context.settings,
      parserPath: context.parserPath,
      parserOptions: context.parserOptions,
    })
    let exportCache = exportCaches.get(cacheKey)
    if (exportCache === undefined) {
      exportCache = new Map()
      exportCaches.set(cacheKey, exportCache)
    }

    exportMap = exportCache.get(path)
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

    exportMap = ExportMap.parse(path, context)
    exportMap.mtime = stats.mtime

    // ignore empties, optionally
    if (exportMap.namespace.size === 0 && isIgnored(path, context)) {
      exportMap = null
    }

    exportCache.set(path, exportMap)

    return exportMap
  }

  static parse(path, context) {
    var m = new ExportMap()

    try {
      var ast = parse(path, context)
    } catch (err) {
      m.errors.push(err)
      return m // can't continue
    }


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
      return resolve.relative(node.source.value, path, context.settings)
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
        const exportMeta = captureDoc(n)
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
              m.namespace.set(n.declaration.id.name, captureDoc(n))
              break
            case 'VariableDeclaration':
              n.declaration.declarations.forEach((d) =>
                recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(d, n))))
              break
          }
        }

        n.specifiers.forEach((s) => {
          const exportMeta = {}
          let local = s.local

          switch (s.type) {
            case 'ExportDefaultSpecifier':
              if (!n.source) return
              local = 'default'
              break
            case 'ExportSpecifier':
              if (!n.source) {
                m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local))
                return
              }
              break
            case 'ExportNamespaceSpecifier':
              m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
                get() { return resolveImport(n) },
              }))
              return
          }

          // todo: JSDoc
          m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(n) })
        })
      }
    })

    return m
  }

  has(name) {
    if (this.namespace.has(name)) return true
    if (this.reexports.has(name)) return true

    for (let dep of this.dependencies.values()) {
      let innerMap = dep()

      // todo: report as unresolved?
      if (!innerMap) continue

      if (innerMap.has(name)) return true
    }

    return false
  }

  get(name) {
    if (this.namespace.has(name)) return this.namespace.get(name)

    if (this.reexports.has(name)) {
      const { local, getImport } = this.reexports.get(name)
          , imported = getImport()
      if (imported == null) return undefined
      return imported.get(local)
    }

    for (let dep of this.dependencies.values()) {
      let innerMap = dep()
      // todo: report as unresolved?
      if (!innerMap) continue
      let innerValue = innerMap.get(name)
      if (innerValue !== undefined) return innerValue
    }

    return undefined
  }

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
 * parse JSDoc from the first node that has leading comments
 * @param  {...[type]} nodes [description]
 * @return {{doc: object}}
 */
function captureDoc(...nodes) {
  const metadata = {}

  // 'some' short-circuits on first 'true'
  nodes.some(n => {
    if (!n.leadingComments) return false

    // capture XSDoc
    n.leadingComments.forEach(comment => {
      // skip non-block comments
      if (comment.value.slice(0, 4) !== "*\n *") return
      try {
        metadata.doc = doctrine.parse(comment.value, { unwrap: true })
      } catch (err) {
        /* don't care, for now? maybe add to `errors?` */
      }
    })
    return true
  })

  return metadata
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

function hashObject(object) {
  const settingsShasum = createHash('sha1')
  settingsShasum.update(JSON.stringify(object))
  return settingsShasum.digest('hex')
}
``
