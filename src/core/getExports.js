import parse from './parse'
import resolve from './resolve'
import { isCore } from 'resolve'
import isIgnored from './ignore'

var exportCache = new Map()

export default class ExportMap {
  constructor(settings) {
    this.settings = settings
    this.named = new Set()

    this.errors = []
  }

  get hasDefault() { return this.named.has('default') }
  get hasNamed() { return this.named.size > (this.hasDefault ? 1 : 0) }

  static get(source, context) {
    // no use trying to parse core modules
    if (isCore(source)) return null

    var path = resolve(source, context)
    if (path == null || isIgnored(path, context)) return null

    return ExportMap.for(path, context.settings)
  }

  static for(path, settings) {
    var exportMap = exportCache.get(path)
    if (exportMap != null) return exportMap

    exportMap = ExportMap.parse(path, settings)

    exportCache.set(path, exportMap)

    // Object.freeze(exportMap)
    // Object.freeze(exportMap.named)

    return exportMap
  }

  static parse(path, settings) {
    var m = new ExportMap(settings)

    try {
      var ast = parse(path, settings)
    } catch (err) {
      m.errors.push(err)
      return m // can't continue
    }

    ast.body.forEach(function (n) {
      m.captureDefault(n)
      m.captureAll(n, path)
      m.captureNamedDeclaration(n, path)
    })

    return m
  }

  resolveReExport(node, base) {
    var remotePath = resolve.relative(node.source.value, base, this.settings)
    if (remotePath == null) return null

    return ExportMap.for(remotePath, this.settings)
  }

  captureDefault(n) {
    if (n.type !== 'ExportDefaultDeclaration') return
    this.named.add('default')
  }

  /**
   * capture all named exports from remote module.
   *
   * returns null if this node wasn't an ExportAllDeclaration
   * returns false if it was not resolved
   * returns true if it was resolved + parsed
   *
   * @param  {node} n
   * @param  {string} path - the path of the module currently parsing
   * @return {boolean?}
   */
  captureAll(n, path) {
    if (n.type !== 'ExportAllDeclaration') return null

    var remoteMap = this.resolveReExport(n, path)
    if (remoteMap == null) return false

    remoteMap.named.forEach(function (name) { this.named.add(name) }.bind(this))

    return true
  }

  captureNamedDeclaration(n, path) {
    if (n.type !== 'ExportNamedDeclaration') return

    // capture declaration
    if (n.declaration != null) {
      switch (n.declaration.type) {
        case 'FunctionDeclaration':
        case 'ClassDeclaration':
          this.named.add(n.declaration.id.name)
          break
        case 'VariableDeclaration':
          n.declaration.declarations.forEach(function (d) {
            this.named.add(d.id.name)
          }.bind(this))
          break
      }
    }

    // capture specifiers
    let remoteMap
    if (n.source) remoteMap = this.resolveReExport(n, path)

    n.specifiers.forEach(function (s) {
      if (s.type === 'ExportDefaultSpecifier') {
        // don't add it if it is not present in the exported module
        if (!remoteMap || !remoteMap.hasDefault) return
      }

      this.named.add(s.exported.name)
    }.bind(this))
  }
}
