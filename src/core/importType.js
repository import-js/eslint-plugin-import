import { isAbsolute as nodeIsAbsolute, relative, resolve as nodeResolve } from 'path';
import isCoreModule from 'is-core-module';
import resolve from 'eslint-module-utils/resolve';
import { getContextPackagePath } from './packagePath';

const scopedRegExp = /^@[^/]+\/?[^/]+/;
const moduleRegExp = /^\w/;
const moduleMainRegExp = /^[\w]((?!\/).)*$/;
const indexFiles = ['.', './', './index', './index.js'];

export function isScoped(name) {
  return name && scopedRegExp.test(name);
}

function baseModule(name) {
  const parts = name.split('/');
  return isScoped(name) ? `${parts[0]}/${parts[1]}` : parts[0];
}

function isInternalRegexMatch(name, settings) {
  const internalScope = settings?.['import/internal-regex'];
  return internalScope && new RegExp(internalScope).test(name);
}

export function isAbsolute(name) {
  return typeof name === 'string' && nodeIsAbsolute(name);
}

export function isBuiltIn(name, settings, path) {
  if (path || !name) return false;
  const base = baseModule(name);
  const extras = settings?.['import/core-modules'] || [];
  return isCoreModule(base) || extras.includes(base);
}

const isModule = (name) => name && moduleRegExp.test(name);

const isModuleMain = (name) => name && moduleMainRegExp.test(name);

function isRelativeToParent(name) {
  return /^\.\.$|^\.\.[\\/]/.test(name);
}

function isIndex(name) {
  return indexFiles.includes(name);
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name);
}

function isExternalPath(path, context) {
  if (!path) return false;

  const { settings } = context;
  const packagePath = getContextPackagePath(context);
  if (relative(packagePath, path).startsWith('..')) {
    return true;
  }

  const folders = settings?.['import/external-module-folders'] || ['node_modules'];
  return folders.some((folder) => {
    const folderPath = nodeResolve(packagePath, folder);
    return !relative(folderPath, path).startsWith('..');
  });
}

function isInternalPath(path, context) {
  if (!path) return false;
  const packagePath = getContextPackagePath(context);
  return !relative(packagePath, path).startsWith('../');
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name);
}

function typeTest(name, context, path) {
  const { settings } = context;
  if (isInternalRegexMatch(name, settings)) return 'internal';
  if (isAbsolute(name)) return 'absolute';
  if (isBuiltIn(name, settings, path)) return 'builtin';
  if (isRelativeToParent(name)) return 'parent';
  if (isIndex(name)) return 'index';
  if (isRelativeToSibling(name)) return 'sibling';
  if (isExternalPath(path, context)) return 'external';
  if (isInternalPath(path, context)) return 'internal';
  if (isExternalLookingName(name)) return 'external';
  return 'unknown';
}

export function isExternalModule(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }
  return (isModule(name) || isScoped(name)) && typeTest(name, context, path) === 'external';
}

export function isExternalModuleMain(name, path, context) {
  if (arguments.length < 3) {
    throw new TypeError('isExternalModuleMain: name, path, and context are all required');
  }
  return isModuleMain(name) && typeTest(name, context, path) === 'external';
}

export function isScopedMain(name) {
  return name && scopedRegExp.test(name);
}

export default function resolveImportType(name, context) {
  return typeTest(name, context, resolve(name, context));
}
