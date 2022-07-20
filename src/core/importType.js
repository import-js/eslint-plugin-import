import { isAbsolute as nodeIsAbsolute, relative, resolve as nodeResolve } from 'path';

import resolve from 'eslint-module-utils/resolve';
import { getContextPackagePath } from './packagePath';
import { Module } from 'module';

const isCoreModule = (pkg) => Module.builtinModules.includes(
  pkg.startsWith('node:')
    ? pkg.slice(5)
    : pkg,
);

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, pkg] = name.split('/');
    return `${scope}/${pkg}`;
  }
  const [pkg] = name.split('/');
  return pkg;
}

function isInternalRegexMatch(name, settings) {
  const internalScope = settings && settings['import/internal-regex'];
  return internalScope && new RegExp(internalScope).test(name);
}

export function isAbsolute(name) {
  return typeof name === 'string' && nodeIsAbsolute(name);
}

// path is defined only when a resolver resolves to a non-standard path
export function isBuiltIn(name, settings, path) {
  if (path || !name) { return false; }
  const base = baseModule(name);
  const extras = settings && settings['import/core-modules'] || [];
  return isCoreModule(base) || extras.indexOf(base) > -1;
}

export function isExternalModule(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }
  return (isModule(name) || isScoped(name)) && typeTest(name, context, path) === 'external';
}

export function isExternalModuleMain(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }
  return isModuleMain(name) && typeTest(name, context, path) === 'external';
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
  return (/^\.\.$|^\.\.[\\/]/).test(name);
}

const indexFiles = ['.', './', './index', './index.js'];
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return (/^\.[\\/]/).test(name);
}

function isExternalPath(path, context) {
  if (!path) {
    return false;
  }

  const { settings } = context;
  const packagePath = getContextPackagePath(context);

  if (relative(packagePath, path).startsWith('..')) {
    return true;
  }

  const folders = settings && settings['import/external-module-folders'] || ['node_modules'];
  return folders.some((folder) => {
    const folderPath = nodeResolve(packagePath, folder);
    const relativePath = relative(folderPath, path);
    return !relativePath.startsWith('..');
  });
}

function isInternalPath(path, context) {
  if (!path) {
    return false;
  }
  const packagePath = getContextPackagePath(context);
  return !relative(packagePath, path).startsWith('../');
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name);
}

function typeTest(name, context, path) {
  const { settings } = context;
  if (isInternalRegexMatch(name, settings)) { return 'internal'; }
  if (isAbsolute(name, settings, path)) { return 'absolute'; }
  if (isBuiltIn(name, settings, path)) { return 'builtin'; }
  if (isRelativeToParent(name, settings, path)) { return 'parent'; }
  if (isIndex(name, settings, path)) { return 'index'; }
  if (isRelativeToSibling(name, settings, path)) { return 'sibling'; }
  if (isExternalPath(path, context)) { return 'external'; }
  if (isInternalPath(path, context)) { return 'internal'; }
  if (isExternalLookingName(name)) { return 'external'; }
  return 'unknown';
}

export default function resolveImportType(name, context) {
  return typeTest(name, context, resolve(name, context));
}
