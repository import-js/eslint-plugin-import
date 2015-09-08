'use strict'

var
  parse = require('./parse'),
  resolve = require('./resolve'),
  isCore = require('resolve').isCore,
  isIgnored = require('./ignore')

var exportCache = new Map()

function ExportMap(settings) {
  this.settings = settings

  this.hasDefault = false
  this.named = new Set()

  this.errors = []
}

ExportMap.get = function (source, context) {

  // no use trying to parse core modules
  if (isCore(source)) return null

  var path = resolve(source, context)
  if (path == null || isIgnored(path, context)) return null

  return ExportMap.for(path, context.settings)
}

ExportMap.for = function (path, settings) {
  var exportMap = exportCache.get(path)
  if (exportMap != null) return exportMap

  exportMap = ExportMap.parse(path, settings)

  exportCache.set(path, exportMap)

  // Object.freeze(exportMap)
  // Object.freeze(exportMap.named)

  return exportMap
}

ExportMap.parse = function (path, settings) {
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

ExportMap.prototype.resolveReExport = function (node, base) {
  var remotePath = resolve.relative(node.source.value, base, this.settings)
  if (remotePath == null) return null

  return ExportMap.for(remotePath, this.settings)
}

ExportMap.prototype.captureDefault = function (n) {
  if (n.type !== 'ExportDefaultDeclaration') return

  this.hasDefault = true
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
ExportMap.prototype.captureAll = function (n, path) {
  if (n.type !== 'ExportAllDeclaration') return null

  var remoteMap = this.resolveReExport(n, path)
  if (remoteMap == null) return false

  remoteMap.named.forEach(function (name) { this.named.add(name) }.bind(this))

  return true
}

ExportMap.prototype.captureNamedDeclaration = function (n, path) {
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
  n.specifiers.forEach(function (s) {
    if (s.type === 'ExportDefaultSpecifier') {
      if (this.hasDefault) return // already has one
      // for ES7 'export default from "..."'
      var remoteMap = this.resolveReExport(n, path)
      this.hasDefault = remoteMap && remoteMap.hasDefault
    } else {
      this.named.add(s.exported.name)
    }
  }.bind(this))
}

module.exports = ExportMap
