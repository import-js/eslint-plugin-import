import { isAbsolute as nodeIsAbsolute, relative, resolve as nodeResolve } from 'path';
import isCoreModule from 'is-core-module';

import resolve from 'eslint-module-utils/resolve';
import { getContextPackagePath } from './packagePath';

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, pkg] = name.split('/');
    return `${scope}/${pkg}`;
  }
  const [pkg] = name.split('/');
  return pkg;
}

export function isAbsolute(name) {
  return nodeIsAbsolute(name);
}

// path is defined only when a resolver resolves to a non-standard path
export function isBuiltIn(name, settings, path) {
  if (path || !name) return false;
  const base = baseModule(name);
  const extras = (settings && settings['import/core-modules']) || [];
  return isCoreModule(base) || extras.indexOf(base) > -1;
}

export function isExternalModule(name, settings, path, context) {
  if (arguments.length < 4) {
    throw new TypeError('isExternalModule: name, settings, path, and context are all required');
  }
  return isModule(name) && isExternalPath(name, settings, path, getContextPackagePath(context));
}

export function isExternalModuleMain(name, settings, path, context) {
  return isModuleMain(name) && isExternalPath(name, settings, path, getContextPackagePath(context));
}

function isExternalPath(name, settings, path, packagePath) {
  const internalScope = (settings && settings['import/internal-regex']);
  if (internalScope && new RegExp(internalScope).test(name)) {
    return false;
  }

  if (!path || relative(packagePath, path).startsWith('..')) {
    return true;
  }

  const folders = (settings && settings['import/external-module-folders']) || ['node_modules'];
  return folders.some((folder) => {
    const folderPath = nodeResolve(packagePath, folder);
    const relativePath = relative(folderPath, path);
    return !relativePath.startsWith('..');
  });
}

const moduleRegExp = /^\w/;
function isModule(name) {
  return name && moduleRegExp.test(name);
}

const moduleMainRegExp = /^[\w]((?!\/).)*$/;
function isModuleMain(name) {
  return name && moduleMainRegExp.test(name);
}

const scopedRegExp = /^@[^/]+\/?[^/]+/;
export function isScoped(name) {
  return name && scopedRegExp.test(name);
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/;
export function isScopedMain(name) {
  return name && scopedMainRegExp.test(name);
}

function isRelativeToParent(name) {
  return/^\.\.$|^\.\.[\\/]/.test(name);
}

const indexFiles = ['.', './', './index', './index.js'];
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name);
}

function typeTest(name, context, path) {
  const { settings } = context;
  if (isAbsolute(name, settings, path)) { return 'absolute'; }
  if (isBuiltIn(name, settings, path)) { return 'builtin'; }
  if (isModule(name, settings, path) || isScoped(name, settings, path)) {
    const packagePath = getContextPackagePath(context);
    return isExternalPath(name, settings, path, packagePath) ? 'external' : 'internal';
  }
  if (isRelativeToParent(name, settings, path)) { return 'parent'; }
  if (isIndex(name, settings, path)) { return 'index'; }
  if (isRelativeToSibling(name, settings, path)) { return 'sibling'; }
  return 'unknown';
}

export function isScopedModule(name) {
  return name.indexOf('@') === 0 && !name.startsWith('@/');
}

export default function resolveImportType(name, context) {
  return typeTest(name, context, resolve(name, context));
}
