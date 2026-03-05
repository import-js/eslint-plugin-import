import { isAbsolute as nodeIsAbsolute, relative, resolve as nodeResolve } from 'path';
import { statSync } from 'fs';
import isCoreModule from 'is-core-module';

import resolve from 'eslint-module-utils/resolve';
import { getContextPackagePath } from './packagePath';

const scopedRegExp = /^@[^/]+\/?[^/]+/;
export function isScoped(name) {
  return name && scopedRegExp.test(name);
}

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

const moduleRegExp = /^\w/;
function isModule(name) {
  return name && moduleRegExp.test(name);
}

const moduleMainRegExp = /^[\w]((?!\/).)*$/;
function isModuleMain(name) {
  return name && moduleMainRegExp.test(name);
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
  const folders = settings && settings['import/external-module-folders'] || ['node_modules'];

  const isOutsidePackage = relative(packagePath, path).startsWith('..');

  return folders.some((folder) => {
    // For absolute folder paths in external-module-folders, check directly
    if (nodeIsAbsolute(folder)) {
      return !relative(folder, path).startsWith('..');
    }

    // Check if the resolved path is under this external folder relative to the package
    const folderPath = nodeResolve(packagePath, folder);
    if (!relative(folderPath, path).startsWith('..')) {
      return true;
    }

    // For paths outside the package root (e.g., hoisted deps in a monorepo),
    // check if the external module folder appears as a path segment in the resolved path.
    // This detects e.g. /monorepo/node_modules/lodash (hoisted) → external,
    // but NOT /monorepo/packages/shared/src (a monorepo sibling or alias target).
    if (isOutsidePackage) {
      const normalizedPath = path.replace(/\\/g, '/');
      const cleanFolder = folder.replace(/[/\\]+$/, '');
      return normalizedPath.includes(`/${cleanFolder}/`);
    }

    return false;
  });
}

function isInternalPath(path, context) {
  if (!path) {
    return false;
  }
  // A resolved path that is not classified as external is internal.
  // This correctly handles aliases and monorepo siblings that resolve to paths
  // outside the package root but are not in any external module folder (e.g., node_modules).
  return !isExternalPath(path, context);
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name);
}

function isInExternalModuleFolder(name, context) {
  const packagePath = getContextPackagePath(context);
  const { settings } = context;
  const folders = settings && settings['import/external-module-folders'] || ['node_modules'];
  const base = baseModule(name);

  return folders.some((folder) => {
    if (nodeIsAbsolute(folder)) {
      try { statSync(nodeResolve(folder, base)); return true; } catch (e) { return false; }
    }
    // Walk up directories checking each external module folder
    let dir = packagePath;
    while (true) { // eslint-disable-line no-constant-condition
      try {
        statSync(nodeResolve(dir, folder, base));
        return true;
      } catch (e) { /* continue */ }
      const parent = nodeResolve(dir, '..');
      if (parent === dir) { break; }
      dir = parent;
    }
    return false;
  });
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
  // Symlinked external modules may realpath outside node_modules.
  // Check if the base module exists in any external module folder.
  if (path && isExternalLookingName(name) && isInExternalModuleFolder(name, context)) { return 'external'; }
  if (isInternalPath(path, context)) { return 'internal'; }
  if (isExternalLookingName(name)) { return 'external'; }
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
    throw new TypeError('isExternalModule: name, path, and context are all required');
  }
  return isModuleMain(name) && typeTest(name, context, path) === 'external';
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/;
export function isScopedMain(name) {
  return name && scopedMainRegExp.test(name);
}

export default function resolveImportType(name, context) {
  return typeTest(name, context, resolve(name, context));
}
