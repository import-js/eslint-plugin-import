import cond from 'lodash.cond'
import builtinModules from 'builtin-modules'
import { join } from 'path'

import resolve from 'eslint-module-utils/resolve'

function constant(value) {
  return () => value
}

export function isAbsolute(name) {
  return name.indexOf('/') === 0
}

export function isBuiltIn(name, settings) {
  const extras = (settings && settings['import/core-modules']) || []
  return builtinModules.indexOf(name) !== -1 || extras.indexOf(name) > -1
}

function isExternalPath(path, name, settings) {
  const folders = (settings && settings['import/external-module-folders']) || ['node_modules']

  // extract the part before the first / (redux-saga/effects => redux-saga)
  const packageName = name.match(/([^\/]+)/)[0]

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
  return externalModuleRegExp.test(name) && !isExternalPath(path, name, settings)
}

function isRelativeToParent(name) {
  return name.indexOf('../') === 0
}

const indexFiles = ['.', './', './index', './index.js']
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1
}

function isRelativeToSibling(name) {
  return name.indexOf('./') === 0
}

const typeTest = cond([
  [isAbsolute, constant('absolute')],
  [isBuiltIn, constant('builtin')],
  [isExternalModule, constant('external')],
  [isScoped, constant('external')],
  [isInternalModule, constant('internal')],
  [isRelativeToParent, constant('parent')],
  [isIndex, constant('index')],
  [isRelativeToSibling, constant('sibling')],
  [constant(true), constant('unknown')],
])

export default function resolveImportType(name, context) {
  return typeTest(name, context.settings, resolve(name, context))
}
