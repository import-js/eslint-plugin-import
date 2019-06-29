const { join } = require('path')

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, pkg] = name.split('/')
    return `${scope}/${pkg}`
  }
  const [pkg] = name.split('/')
  return pkg
}

// path is defined only when a resolver resolves to a non-standard path
function isBuiltIn(name, settings, path) {
  if (path) return false
  const base = baseModule(name)
  const extras = (settings && settings['import/core-modules']) || []
  return (name && !path) || extras.indexOf(base) > -1
}

function isExternalPath(path, name, settings) {
  const folders = (settings && settings['import/external-module-folders']) || ['node_modules']

  // extract the part before the first / (redux-saga/effects => redux-saga)
  const packageName = name.match(/([^/]+)/)[0]

  return !path || folders.some(folder => -1 < path.indexOf(join(folder, packageName)))
}

const externalModuleRegExp = /^\w/
function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings)
}

const scopedRegExp = /^@[^/]+\/[^/]+/
function isScoped(name) {
  return scopedRegExp.test(name)
}

function isInternalModule(name, settings, path) {
  const matchesScopedOrExternalRegExp = scopedRegExp.test(name) || externalModuleRegExp.test(name)
  return (matchesScopedOrExternalRegExp && !isExternalPath(path, name, settings))
}

function isRelativeToParent(name) {
  return /^\.\.[\\/]/.test(name)
}

const indexFiles = ['.', './', './index', './index.js']
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name)
}

module.exports = function resolveLegacyResolverType(name, context, path) {
  if (isBuiltIn(name, context, path)) return 'builtin'
  if (isInternalModule(name, context, path)) return 'internal'
  if (isExternalModule(name, context, path) || isScoped(name)) return 'external'
  if (isRelativeToParent(name) || isIndex(name) || isRelativeToSibling(name)) return 'internal'

  return undefined
}
