import * as fs from 'fs'

import { createHash } from 'crypto'
import * as doctrine from 'doctrine'

import parse from './parse'
import resolve from './resolve'
import isIgnored from './ignore'

export default class ExportMap {
  constructor() {
    this.namespace = new Map()
    this.errors = []
  }


  /**
   * @deprecated use 'namespace'
   * @return {Map}
   */
  get named() { return this.namespace }
  get hasDefault() { return this.namespace.has('default') }
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

    // todo: evict ENOENT cache entries
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

    // queues a save of the caches
    queueCacheSave(CACHE_FILE, exportCaches)

    return exportMap
  }

  static parse(path, context) {
    var m = new ExportMap(context)

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

    function getNamespace(identifier) {
      if (!namespaces.has(identifier.name)) return

      let namespace = m.resolveReExport(context, namespaces.get(identifier.name), path)
      if (namespace) return { namespace: namespace.namespace }
    }

    ast.body.forEach(function (n) {

      if (n.type === 'ExportDefaultDeclaration') {
        const exportMeta = captureDoc(n)
        if (n.declaration.type === 'Identifier') {
          Object.assign(exportMeta, getNamespace(n.declaration))
        }
        m.namespace.set('default', exportMeta)
        return
      }

      if (n.type === 'ExportAllDeclaration') {
        let remoteMap = m.resolveReExport(context, n, path)
        if (remoteMap == null) return
        remoteMap.namespace.forEach((value, name) => { m.namespace.set(name, value) })
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

        // capture specifiers
        let remoteMap
        if (n.source) remoteMap = m.resolveReExport(context, n, path)

        n.specifiers.forEach((s) => {
          const exportMeta = {}

          if (s.type === 'ExportDefaultSpecifier') {
            // don't add it if it is not present in the exported module
            if (!remoteMap || !remoteMap.hasDefault) return
          } else if (s.type === 'ExportSpecifier'){
            Object.assign(exportMeta, getNamespace(s.local))
          } else if (s.type === 'ExportNamespaceSpecifier') {
            exportMeta.namespace = remoteMap.namespace
          }

          // todo: JSDoc
          m.namespace.set(s.exported.name, exportMeta)
        })
      }
    })

    return m
  }

  resolveReExport(context, node, base) {
    var remotePath = resolve.relative(node.source.value, base, context.settings)
    if (remotePath == null) return null

    return ExportMap.for(remotePath, context)
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

// map from settings sha1 => path => export map objects
const CACHE_FILE = "import.cache"
const exportCaches = loadFSCaches(CACHE_FILE)

import { readFileSync, writeFile } from 'fs'

// TODO: save as directory structure and load on demand?

function loadFSCaches(filename) {
  function rehydrateExports([key, dry]) {
    if (!dry) return [key, dry] // null map

    const wet = new ExportMap()
    wet.namespace = new Map(dry.namespace.map(rehydrateNamespace))
    wet.mtime = dry.mtime
    return [key, wet]
  }

  try {
    const caches = JSON.parse(readFileSync(filename))
        , map = new Map()
    for (let key in caches) {
      map.set(key, new Map(caches[key].map(rehydrateExports)))
    }
    return map
  } catch (err) {
    /* ??? */
    return new Map()
  }
}

function saveFSCaches(filename, caches) {
  const dry = {}
  for (let [hash, maps] of caches) {
    dry[hash] = Array.from(maps, dehydrate)
  }
  // fire and forget
  writeFile(filename, JSON.stringify(dry), () => null)
}

let queued
/**
 * only write the cache a maximum of
 * @param  {[type]} caches [description]
 * @return {[type]}        [description]
 */
function queueCacheSave(filename, caches) {
  function S() {
    saveFSCaches(filename, queued)
    queued = null
  }
  if (!queued) process.nextTick(S)
  queued = caches
}

function rehydrateNamespace(o) {
  if (o.namespace) o.namespace = new Map(o.namespace.map(rehydrateNamespace))
  return o
}

function dehydrate([key, map]) {
  return [ key, map && {
    mtime: map.mtime,
    namespace: Array.from(map.namespace, dehydrateMapKeys),
  } ]
}

function dehydrateMapKeys([k, o]) {
  const dry = {}
  for (let key in o) {
    const val = o[key]
    if (val instanceof Map) {
      dry[key] = Array.from(val, dehydrateMapKeys)
    } else {
      dry[key] = val
    }
  }
  return [k, dry]
}
