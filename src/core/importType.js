import cond from 'lodash.cond'
import builtinModules from 'builtin-modules'
import { basename, join } from 'path'

import resolve from './resolve'

function constant(value) {
  return () => value
}

function isBuiltIn(name) {
  return builtinModules.indexOf(name) !== -1
}

const externalModuleRegExp = /^\w/
function isExternalModule(name, path) {
  if (!externalModuleRegExp.test(name)) return false
  return (!path || path.includes(join('node_modules', name)))
}

function isProjectModule(name, path) {
  if (!externalModuleRegExp.test(name)) return false
  return (path && !path.includes(join('node_modules', name)))
}

function isRelativeToParent(name) {
  return name.indexOf('../') === 0
}

const indexFiles = ['.', './', './index', './index.js']
function isIndex(name, path) {
  if (path) return basename(path).split('.')[0] === 'index'
  return indexFiles.indexOf(name) !== -1
}

function isRelativeToSibling(name) {
  return name.indexOf('./') === 0
}

const typeTest = cond([
  [isBuiltIn, constant('builtin')],
  [isExternalModule, constant('external')],
  [isProjectModule, constant('project')],
  [isRelativeToParent, constant('parent')],
  [isIndex, constant('index')],
  [isRelativeToSibling, constant('sibling')],
  [constant(true), constant('unknown')],
])

export default function resolveImportType(name, context) {
  return typeTest(name, resolve(name, context))
}
