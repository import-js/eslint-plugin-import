import minimatch from 'minimatch'

import coreModules from 'resolve/lib/core'

import resolve from 'eslint-module-utils/resolve'

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, pkg] = name.split('/')
    return `${scope}/${pkg}`
  }
  const [pkg] = name.split('/')
  return pkg
}

export function isAbsolute(name) {
  return name.indexOf('/') === 0
}

// path is defined only when a resolver resolves to a non-standard path
export function isBuiltIn(name, settings, path) {
  if (path || !name) return false
  const base = baseModule(name)
  const extras = (settings && settings['import/core-modules']) || []
  return coreModules[base] || extras.indexOf(base) > -1
}

function isExternalPath(path, name, settings) {
  const folders = (settings && settings['import/external-module-folders']) || ['node_modules']
  return !path || folders.some(folder => isSubpath(folder, path))
}

function isSubpath(subpath, path) {
  const normPath = path.replace(/\\/g, '/')
  const normSubpath = subpath.replace(/\\/g, '/').replace(/\/$/, '')
  if (normSubpath.length === 0) {
    return false
  }
  const left = normPath.indexOf(normSubpath)
  const right = left + normSubpath.length
  return left !== -1 &&
        (left === 0 || normSubpath[0] !== '/' && normPath[left - 1] === '/') &&
        (right >= normPath.length || normPath[right] === '/')
}

const externalModuleRegExp = /^\w/
export function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings)
}

const externalModuleMainRegExp = /^[\w]((?!\/).)*$/
export function isExternalModuleMain(name, settings, path) {
  return externalModuleMainRegExp.test(name) && isExternalPath(path, name, settings)
}

const scopedRegExp = /^@[^/]*\/?[^/]+/
export function isScoped(name) {
  return name && scopedRegExp.test(name)
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/
export function isScopedMain(name) {
  return name && scopedMainRegExp.test(name)
}

function isInternalModule(name, settings, path) {
  const internalScope = (settings && settings['import/internal-regex'])
  const matchesScopedOrExternalRegExp = scopedRegExp.test(name) || externalModuleRegExp.test(name)
  return (matchesScopedOrExternalRegExp && (internalScope && new RegExp(internalScope).test(name) || !isExternalPath(path, name, settings)))
}

function isRelativeToParent(name) {
  return/^\.\.$|^\.\.[\\/]/.test(name)
}

const indexFiles = ['.', './', './index', './index.js']
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name)
}

function findMatchGlobGroup(name, groups) {
  for (let globPatter of groups) {
    if (minimatch(name, globPatter)) {
      return globPatter
    }
  }
}

function typeTest(name, settings, groups, path) {
  const matchedGlob = findMatchGlobGroup(name, groups)

  if (matchedGlob) { return matchedGlob }
  if (isAbsolute(name, settings, path)) { return 'absolute' }
  if (isBuiltIn(name, settings, path)) { return 'builtin' }
  if (isInternalModule(name, settings, path)) { return 'internal' }
  if (isExternalModule(name, settings, path)) { return 'external' }
  if (isScoped(name, settings, path)) { return 'external' }
  if (isRelativeToParent(name, settings, path)) { return 'parent' }
  if (isIndex(name, settings, path)) { return 'index' }
  if (isRelativeToSibling(name, settings, path)) { return 'sibling' }
  return 'unknown'
}

export function isScopedModule(name) {
  return name.indexOf('@') === 0
}

export default function resolveImportType(name, context) {
  const groups = (context.options[0] || {}).groups

  return typeTest(name, context.settings, groups, resolve(name, context))
}
