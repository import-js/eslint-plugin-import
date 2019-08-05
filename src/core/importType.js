import coreModules from 'resolve/lib/core'
import { join } from 'path'

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
  if (path) return false
  const base = baseModule(name)
  const extras = (settings && settings['import/core-modules']) || []
  return coreModules[base] || extras.indexOf(base) > -1
}

function isExternalPath(path, name, settings) {
  const folders = (settings && settings['import/external-module-folders']) || ['node_modules']

  // extract the part before the first / (redux-saga/effects => redux-saga)
  const packageName = name.match(/([^/]+)/)[0]

  return !path || folders.some(folder => -1 < path.indexOf(join(folder, packageName)))
}

const externalModuleRegExp = /^\w/
export function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings)
}

const externalModuleMainRegExp = /^[\w]((?!\/).)*$/
export function isExternalModuleMain(name, settings, path) {
  return externalModuleMainRegExp.test(name) && isExternalPath(path, name, settings)
}

const scopedRegExp = /^@[^/]+\/?[^/]+/
function isScoped(name) {
  return scopedRegExp.test(name)
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/
export function isScopedMain(name) {
  return scopedMainRegExp.test(name)
}

function isInternalModule(name, settings, path) {
  const internalScope = (settings && settings['import/internal-regex'])
  const matchesScopedOrExternalRegExp = scopedRegExp.test(name) || externalModuleRegExp.test(name)
  return (matchesScopedOrExternalRegExp && (internalScope && new RegExp(internalScope).test(name) || !isExternalPath(path, name, settings)))
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

function typeTest(name, settings, path) {
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

export default function resolveImportType(name, context) {
  return typeTest(name, context.settings, resolve(name, context))
}
