import cond from 'lodash.cond'
import builtinModules from 'builtin-modules'
import { join } from 'path'

import resolve from './resolve'

function constant(value) {
  return () => value
}

export function isBuiltIn(name) {
  return builtinModules.indexOf(name) !== -1
}

const externalModuleRegExp = /^\w/
function isExternalModule(name, path) {
  if (!externalModuleRegExp.test(name)) return false
  return (!path || -1 < path.indexOf(join('node_modules', name)))
}

const scopedRegExp = /^@\w+\/\w+/
function isScoped(name) {
  return scopedRegExp.test(name)
}

function isInternalModule(name, path) {
  if (!externalModuleRegExp.test(name)) return false
  return (path && -1 === path.indexOf(join('node_modules', name)))
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
  return typeTest(name, resolve(name, context))
}
