'use strict'

import cond from 'lodash.cond'
import builtinModules from 'builtin-modules'

function constant(value) {
  return () => value
}

function isBuiltIn(name) {
  return builtinModules.indexOf(name) !== -1
}

const externalModuleRegExp = /^\w/
function isExternalModule(name) {
  return externalModuleRegExp.test(name)
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

export default cond([
  [isBuiltIn, constant('builtin')],
  [isExternalModule, constant('external')],
  [isRelativeToParent, constant('parent')],
  [isIndex, constant('index')],
  [isRelativeToSibling, constant('sibling')],
  [constant(true), constant('unknown')],
])
