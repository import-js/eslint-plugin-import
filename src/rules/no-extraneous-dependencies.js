import path from 'path';
import fs from 'fs';
import pkgUp from 'eslint-module-utils/pkgUp';
import minimatch from 'minimatch';
import resolve from 'eslint-module-utils/resolve';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import importType from '../core/importType';
import { getFilePackageName } from '../core/packagePath';
import docsUrl from '../docsUrl';

const depFieldCache = new Map();

function hasKeys(obj = {}) {
  return Object.keys(obj).length > 0;
}

function arrayOrKeys(arrayOrObject) {
  return Array.isArray(arrayOrObject) ? arrayOrObject : Object.keys(arrayOrObject);
}

function readJSON(jsonPath, throwException) {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    if (throwException) {
      throw err;
    }
  }
}

function extractDepFields(pkg) {
  return {
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    optionalDependencies: pkg.optionalDependencies || {},
    peerDependencies: pkg.peerDependencies || {},
    // BundledDeps should be in the form of an array, but object notation is also supported by
    // `npm`, so we convert it to an array if it is an object
    bundledDependencies: arrayOrKeys(pkg.bundleDependencies || pkg.bundledDependencies || []),
  };
}

function getPackageDepFields(packageJsonPath, throwAtRead) {
  if (!depFieldCache.has(packageJsonPath)) {
    const packageJson = readJSON(packageJsonPath, throwAtRead);
    if (packageJson) {
      const depFields = extractDepFields(packageJson);
      depFieldCache.set(packageJsonPath, depFields);
    }
  }

  return depFieldCache.get(packageJsonPath);
}

function getDependencies(context, packageDir) {
  let paths = [];
  try {
    const packageContent = {
      dependencies: {},
      devDependencies: {},
      optionalDependencies: {},
      peerDependencies: {},
      bundledDependencies: [],
    };

    if (packageDir && packageDir.length > 0) {
      if (!Array.isArray(packageDir)) {
        paths = [path.resolve(packageDir)];
      } else {
        paths = packageDir.map((dir) => path.resolve(dir));
      }
    }

    if (paths.length > 0) {
      // use rule config to find package.json
      paths.forEach((dir) => {
        const packageJsonPath = path.join(dir, 'package.json');
        const _packageContent = getPackageDepFields(packageJsonPath, paths.length === 1);
        if (_packageContent) {
          Object.keys(packageContent).forEach((depsKey) => {
            Object.assign(packageContent[depsKey], _packageContent[depsKey]);
          });
        }
      });
    } else {
      const packageJsonPath = pkgUp({
        cwd: context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename(),
        normalize: false,
      });

      // use closest package.json
      Object.assign(
        packageContent,
        getPackageDepFields(packageJsonPath, false),
      );
    }

    if (![
      packageContent.dependencies,
      packageContent.devDependencies,
      packageContent.optionalDependencies,
      packageContent.peerDependencies,
      packageContent.bundledDependencies,
    ].some(hasKeys)) {
      return null;
    }

    return packageContent;
  } catch (e) {
    if (paths.length > 0 && e.code === 'ENOENT') {
      context.report({
        message: 'The package.json file could not be found.',
        loc: { line: 0, column: 0 },
      });
    }
    if (e.name === 'JSONError' || e instanceof SyntaxError) {
      context.report({
        message: `The package.json file could not be parsed: ${e.message}`,
        loc: { line: 0, column: 0 },
      });
    }

    return null;
  }
}

function missingErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies. Run 'npm i -S ${packageName}' to add it`;
}

function devDepErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies, not devDependencies.`;
}

function optDepErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies, not optionalDependencies.`;
}

function getModuleOriginalName(name) {
  const [first, second] = name.split('/');
  return first.startsWith('@') ? `${first}/${second}` : first;
}

function getModuleRealName(resolved) {
  return getFilePackageName(resolved);
}

function checkDependencyDeclaration(deps, packageName, declarationStatus) {
  const newDeclarationStatus = declarationStatus || {
    isInDeps: false,
    isInDevDeps: false,
    isInOptDeps: false,
    isInPeerDeps: false,
    isInBundledDeps: false,
  };

  // in case of sub package.json inside a module
  // check the dependencies on all hierarchy
  const packageHierarchy = [];
  const packageNameParts = packageName ? packageName.split('/') : [];
  packageNameParts.forEach((namePart, index) => {
    if (!namePart.startsWith('@')) {
      const ancestor = packageNameParts.slice(0, index + 1).join('/');
      packageHierarchy.push(ancestor);
    }
  });

  return packageHierarchy.reduce((result, ancestorName) => ({
    isInDeps: result.isInDeps || deps.dependencies[ancestorName] !== undefined,
    isInDevDeps: result.isInDevDeps || deps.devDependencies[ancestorName] !== undefined,
    isInOptDeps: result.isInOptDeps || deps.optionalDependencies[ancestorName] !== undefined,
    isInPeerDeps: result.isInPeerDeps || deps.peerDependencies[ancestorName] !== undefined,
    isInBundledDeps:
        result.isInBundledDeps || deps.bundledDependencies.indexOf(ancestorName) !== -1,
  }), newDeclarationStatus);
}

function reportIfMissing(context, deps, depsOptions, node, name) {
  // Do not report when importing types unless option is enabled
  if (
    !depsOptions.verifyTypeImports
    && (
      node.importKind === 'type'
      || node.importKind === 'typeof'
      || node.exportKind === 'type'
      || Array.isArray(node.specifiers) && node.specifiers.length && node.specifiers.every((specifier) => specifier.importKind === 'type' || specifier.importKind === 'typeof')
    )
  ) {
    return;
  }

  const typeOfImport = importType(name, context);

  if (
    typeOfImport !== 'external'
    && (typeOfImport !== 'internal' || !depsOptions.verifyInternalDeps)
  ) {
    return;
  }

  const resolved = resolve(name, context);
  if (!resolved) { return; }

  const importPackageName = getModuleOriginalName(name);
  let declarationStatus = checkDependencyDeclaration(deps, importPackageName);

  if (
    declarationStatus.isInDeps
    || depsOptions.allowDevDeps && declarationStatus.isInDevDeps
    || depsOptions.allowPeerDeps && declarationStatus.isInPeerDeps
    || depsOptions.allowOptDeps && declarationStatus.isInOptDeps
    || depsOptions.allowBundledDeps && declarationStatus.isInBundledDeps
  ) {
    return;
  }

  // test the real name from the resolved package.json
  // if not aliased imports (alias/react for example), importPackageName can be misinterpreted
  const realPackageName = getModuleRealName(resolved);
  if (realPackageName && realPackageName !== importPackageName) {
    declarationStatus = checkDependencyDeclaration(deps, realPackageName, declarationStatus);

    if (
      declarationStatus.isInDeps
      || depsOptions.allowDevDeps && declarationStatus.isInDevDeps
      || depsOptions.allowPeerDeps && declarationStatus.isInPeerDeps
      || depsOptions.allowOptDeps && declarationStatus.isInOptDeps
      || depsOptions.allowBundledDeps && declarationStatus.isInBundledDeps
    ) {
      return;
    }
  }

  if (declarationStatus.isInDevDeps && !depsOptions.allowDevDeps) {
    context.report(node, devDepErrorMessage(realPackageName || importPackageName));
    return;
  }

  if (declarationStatus.isInOptDeps && !depsOptions.allowOptDeps) {
    context.report(node, optDepErrorMessage(realPackageName || importPackageName));
    return;
  }

  context.report(node, missingErrorMessage(realPackageName || importPackageName));
}

function testConfig(config, filename) {
  // Simplest configuration first, either a boolean or nothing.
  if (typeof config === 'boolean' || typeof config === 'undefined') {
    return config;
  }
  // Array of globs.
  return config.some((c) => minimatch(filename, c)
    || minimatch(filename, path.join(process.cwd(), c)),
  );
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid the use of extraneous packages.',
      url: docsUrl('no-extraneous-dependencies'),
    },

    schema: [
      {
        type: 'object',
        properties: {
          devDependencies: { type: ['boolean', 'array'] },
          optionalDependencies: { type: ['boolean', 'array'] },
          peerDependencies: { type: ['boolean', 'array'] },
          bundledDependencies: { type: ['boolean', 'array'] },
          packageDir: { type: ['string', 'array'] },
          includeInternal: { type: ['boolean'] },
          includeTypes: { type: ['boolean'] },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const filename = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
    const deps = getDependencies(context, options.packageDir) || extractDepFields({});

    const depsOptions = {
      allowDevDeps: testConfig(options.devDependencies, filename) !== false,
      allowOptDeps: testConfig(options.optionalDependencies, filename) !== false,
      allowPeerDeps: testConfig(options.peerDependencies, filename) !== false,
      allowBundledDeps: testConfig(options.bundledDependencies, filename) !== false,
      verifyInternalDeps: !!options.includeInternal,
      verifyTypeImports: !!options.includeTypes,
    };

    return moduleVisitor((source, node) => {
      reportIfMissing(context, deps, depsOptions, node, source.value);
    }, { commonjs: true });
  },

  'Program:exit'() {
    depFieldCache.clear();
  },
};
