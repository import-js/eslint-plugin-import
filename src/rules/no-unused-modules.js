/**
 * @fileOverview Ensures that modules contain exports and/or all
 * modules are consumed within other modules.
 * @author René Fermann
 */

import { getPhysicalFilename } from 'eslint-module-utils/contextCompat';
import { getFileExtensions } from 'eslint-module-utils/ignore';
import resolve from 'eslint-module-utils/resolve';
import visit from 'eslint-module-utils/visit';
import { dirname, join } from 'path';
import readPkgUp from 'eslint-module-utils/readPkgUp';

import ExportMapBuilder from '../exportMap/builder';
import recursivePatternCapture from '../exportMap/patternCapture';
import docsUrl from '../docsUrl';

/**
 * Attempt to load the internal `FileEnumerator` class, which has existed in a couple
 * of different places, depending on the version of `eslint`.  Try requiring it from both
 * locations.
 * @returns Returns the `FileEnumerator` class if its requirable, otherwise `undefined`.
 */
function requireFileEnumerator() {
  let FileEnumerator;

  // Try getting it from the eslint private / deprecated api
  try {
    ({ FileEnumerator } = require('eslint/use-at-your-own-risk'));
  } catch (e) {
    // Absorb this if it's MODULE_NOT_FOUND
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }

    // If not there, then try getting it from eslint/lib/cli-engine/file-enumerator (moved there in v6)
    try {
      ({ FileEnumerator } = require('eslint/lib/cli-engine/file-enumerator'));
    } catch (e) {
      // Absorb this if it's MODULE_NOT_FOUND
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
    }
  }
  return FileEnumerator;
}

/**
 * Given a FileEnumerator class, instantiate and load the list of files.
 * @param FileEnumerator the `FileEnumerator` class from `eslint`'s internal api
 * @param {string} src path to the src root
 * @param {string[]} extensions list of supported extensions
 * @returns {{ filename: string, ignored: boolean }[]} list of files to operate on
 */
function listFilesUsingFileEnumerator(FileEnumerator, src, extensions) {
  // We need to know whether this is being run with flat config in order to
  // determine how to report errors if FileEnumerator throws due to a lack of eslintrc.

  const { ESLINT_USE_FLAT_CONFIG } = process.env;

  // This condition is sufficient to test in v8, since the environment variable is necessary to turn on flat config
  let isUsingFlatConfig = ESLINT_USE_FLAT_CONFIG && process.env.ESLINT_USE_FLAT_CONFIG !== 'false';

  // In the case of using v9, we can check the `shouldUseFlatConfig` function
  // If this function is present, then we assume it's v9
  try {
    const { shouldUseFlatConfig } = require('eslint/use-at-your-own-risk');
    isUsingFlatConfig = shouldUseFlatConfig && ESLINT_USE_FLAT_CONFIG !== 'false';
  } catch (_) {
    // We don't want to throw here, since we only want to update the
    // boolean if the function is available.
  }

  const enumerator = new FileEnumerator({
    extensions,
  });

  try {
    return Array.from(
      enumerator.iterateFiles(src),
      ({ filePath, ignored }) => ({ filename: filePath, ignored }),
    );
  } catch (e) {
    // If we're using flat config, and FileEnumerator throws due to a lack of eslintrc,
    // then we want to throw an error so that the user knows about this rule's reliance on
    // the legacy config.
    if (
      isUsingFlatConfig
      && e.message.includes('No ESLint configuration found')
    ) {
      throw new Error(`
Due to the exclusion of certain internal ESLint APIs when using flat config,
the import/no-unused-modules rule requires an .eslintrc file to know which
files to ignore (even when using flat config).
The .eslintrc file only needs to contain "ignorePatterns", or can be empty if
you do not want to ignore any files.

See https://github.com/import-js/eslint-plugin-import/issues/3079
for additional context.
`);
    }
    // If this isn't the case, then we'll just let the error bubble up
    throw e;
  }
}

/**
 * Attempt to require old versions of the file enumeration capability from v6 `eslint` and earlier, and use
 * those functions to provide the list of files to operate on
 * @param {string} src path to the src root
 * @param {string[]} extensions list of supported extensions
 * @returns {string[]} list of files to operate on
 */
function listFilesWithLegacyFunctions(src, extensions) {
  try {
    // eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
    const { listFilesToProcess: originalListFilesToProcess } = require('eslint/lib/util/glob-utils');
    // Prevent passing invalid options (extensions array) to old versions of the function.
    // https://github.com/eslint/eslint/blob/v5.16.0/lib/util/glob-utils.js#L178-L280
    // https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob-util.js#L174-L269

    return originalListFilesToProcess(src, {
      extensions,
    });
  } catch (e) {
    // Absorb this if it's MODULE_NOT_FOUND
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }

    // Last place to try (pre v5.3)
    const {
      listFilesToProcess: originalListFilesToProcess,
    } = require('eslint/lib/util/glob-util');
    const patterns = src.concat(
      src.flatMap(
        (pattern) => extensions.map((extension) => (/\*\*|\*\./).test(pattern) ? pattern : `${pattern}/**/*${extension}`),
      ),
    );

    return originalListFilesToProcess(patterns);
  }
}

/**
 * Given a src pattern and list of supported extensions, return a list of files to process
 * with this rule.
 * @param {string} src - file, directory, or glob pattern of files to act on
 * @param {string[]} extensions - list of supported file extensions
 * @returns {string[] | { filename: string, ignored: boolean }[]} the list of files that this rule will evaluate.
 */
function listFilesToProcess(src, extensions) {
  const FileEnumerator = requireFileEnumerator();

  // If we got the FileEnumerator, then let's go with that
  if (FileEnumerator) {
    return listFilesUsingFileEnumerator(FileEnumerator, src, extensions);
  }
  // If not, then we can try even older versions of this capability (listFilesToProcess)
  return listFilesWithLegacyFunctions(src, extensions);
}

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
const EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
const IMPORT_DECLARATION = 'ImportDeclaration';
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
const VARIABLE_DECLARATION = 'VariableDeclaration';
const FUNCTION_DECLARATION = 'FunctionDeclaration';
const CLASS_DECLARATION = 'ClassDeclaration';
const IDENTIFIER = 'Identifier';
const OBJECT_PATTERN = 'ObjectPattern';
const ARRAY_PATTERN = 'ArrayPattern';
const TS_INTERFACE_DECLARATION = 'TSInterfaceDeclaration';
const TS_TYPE_ALIAS_DECLARATION = 'TSTypeAliasDeclaration';
const TS_ENUM_DECLARATION = 'TSEnumDeclaration';
const DEFAULT = 'default';

function forEachDeclarationIdentifier(declaration, cb) {
  if (declaration) {
    const isTypeDeclaration = declaration.type === TS_INTERFACE_DECLARATION
      || declaration.type === TS_TYPE_ALIAS_DECLARATION
      || declaration.type === TS_ENUM_DECLARATION;

    if (
      declaration.type === FUNCTION_DECLARATION
      || declaration.type === CLASS_DECLARATION
      || isTypeDeclaration
    ) {
      cb(declaration.id.name, isTypeDeclaration);
    } else if (declaration.type === VARIABLE_DECLARATION) {
      declaration.declarations.forEach(({ id }) => {
        if (id.type === OBJECT_PATTERN) {
          recursivePatternCapture(id, (pattern) => {
            if (pattern.type === IDENTIFIER) {
              cb(pattern.name, false);
            }
          });
        } else if (id.type === ARRAY_PATTERN) {
          id.elements.forEach(({ name }) => {
            cb(name, false);
          });
        } else {
          cb(id.name, false);
        }
      });
    }
  }
}

/**
 * List of imports per file.
 *
 * Represented by a two-level Map to a Set of identifiers. The upper-level Map
 * keys are the paths to the modules containing the imports, while the
 * lower-level Map keys are the paths to the files which are being imported
 * from. Lastly, the Set of identifiers contains either names being imported
 * or a special AST node name listed above (e.g ImportDefaultSpecifier).
 *
 * For example, if we have a file named foo.js containing:
 *
 *   import { o2 } from './bar.js';
 *
 * Then we will have a structure that looks like:
 *
 *   Map { 'foo.js' => Map { 'bar.js' => Set { 'o2' } } }
 *
 * @type {Map<string, Map<string, Set<string>>>}
 */
const importList = new Map();

/**
 * List of exports per file.
 *
 * Represented by a two-level Map to an object of metadata. The upper-level Map
 * keys are the paths to the modules containing the exports, while the
 * lower-level Map keys are the specific identifiers or special AST node names
 * being exported. The leaf-level metadata object at the moment only contains a
 * `whereUsed` property, which contains a Set of paths to modules that import
 * the name.
 *
 * For example, if we have a file named bar.js containing the following exports:
 *
 *   const o2 = 'bar';
 *   export { o2 };
 *
 * And a file named foo.js containing the following import:
 *
 *   import { o2 } from './bar.js';
 *
 * Then we will have a structure that looks like:
 *
 *   Map { 'bar.js' => Map { 'o2' => { whereUsed: Set { 'foo.js' } } } }
 *
 * @type {Map<string, Map<string, object>>}
 */
const exportList = new Map();

const visitorKeyMap = new Map();

/** @type {Set<string>} */
const ignoredFiles = new Set();
const filesOutsideSrc = new Set();

const isNodeModule = (path) => (/\/(node_modules)\//).test(path);

/**
 * read all files matching the patterns in src and ignoreExports
 *
 * return all files matching src pattern, which are not matching the ignoreExports pattern
 * @type {(src: string, ignoreExports: string, context: import('eslint').Rule.RuleContext) => Set<string>}
 */
function resolveFiles(src, ignoreExports, context) {
  const extensions = Array.from(getFileExtensions(context.settings));

  const srcFileList = listFilesToProcess(src, extensions);

  // prepare list of ignored files
  const ignoredFilesList = listFilesToProcess(ignoreExports, extensions);

  // The modern api will return a list of file paths, rather than an object
  if (ignoredFilesList.length && typeof ignoredFilesList[0] === 'string') {
    ignoredFilesList.forEach((filename) => ignoredFiles.add(filename));
  } else {
    ignoredFilesList.forEach(({ filename }) => ignoredFiles.add(filename));
  }

  // prepare list of source files, don't consider files from node_modules
  const resolvedFiles = srcFileList.length && typeof srcFileList[0] === 'string'
    ? srcFileList.filter((filePath) => !isNodeModule(filePath))
    : srcFileList.flatMap(({ filename }) => isNodeModule(filename) ? [] : filename);

  return new Set(resolvedFiles);
}

/**
 * parse all source files and build up 2 maps containing the existing imports and exports
 */
const prepareImportsAndExports = (srcFiles, context) => {
  const exportAll = new Map();
  srcFiles.forEach((file) => {
    const exports = new Map();
    const imports = new Map();
    const currentExports = ExportMapBuilder.get(file, context);
    if (currentExports) {
      const {
        dependencies,
        reexports,
        imports: localImportList,
        namespace,
        visitorKeys,
      } = currentExports;

      visitorKeyMap.set(file, visitorKeys);
      // dependencies === export * from
      const currentExportAll = new Set();
      dependencies.forEach((getDependency) => {
        const dependency = getDependency();
        if (dependency === null) {
          return;
        }

        currentExportAll.add(dependency.path);
      });
      exportAll.set(file, currentExportAll);

      reexports.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
        const reexport = value.getImport();
        if (!reexport) {
          return;
        }
        let localImport = imports.get(reexport.path);
        let currentValue;
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER;
        } else {
          currentValue = value.local;
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([...localImport, currentValue]);
        } else {
          localImport = new Set([currentValue]);
        }
        imports.set(reexport.path, localImport);
      });

      localImportList.forEach((value, key) => {
        if (isNodeModule(key)) {
          return;
        }
        const localImport = imports.get(key) || new Set();
        value.declarations.forEach(({ importedSpecifiers }) => {
          importedSpecifiers.forEach((specifier) => {
            localImport.add(specifier);
          });
        });
        imports.set(key, localImport);
      });
      importList.set(file, imports);

      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return;
      }
      namespace.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
      });
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() });
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() });
    exportList.set(file, exports);
  });
  exportAll.forEach((value, key) => {
    value.forEach((val) => {
      const currentExports = exportList.get(val);
      if (currentExports) {
        const currentExport = currentExports.get(EXPORT_ALL_DECLARATION);
        currentExport.whereUsed.add(key);
      }
    });
  });
};

/**
 * traverse through all imports and add the respective path to the whereUsed-list
 * of the corresponding export
 */
const determineUsage = () => {
  importList.forEach((listValue, listKey) => {
    listValue.forEach((value, key) => {
      const exports = exportList.get(key);
      if (typeof exports !== 'undefined') {
        value.forEach((currentImport) => {
          let specifier;
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER;
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER;
          } else {
            specifier = currentImport;
          }
          if (typeof specifier !== 'undefined') {
            const exportStatement = exports.get(specifier);
            if (typeof exportStatement !== 'undefined') {
              const { whereUsed } = exportStatement;
              whereUsed.add(listKey);
              exports.set(specifier, { whereUsed });
            }
          }
        });
      }
    });
  });
};

const getSrc = (src) => {
  if (src) {
    return src;
  }
  return [process.cwd()];
};

/**
 * prepare the lists of existing imports and exports - should only be executed once at
 * the start of a new eslint run
 */
/** @type {Set<string>} */
let srcFiles;
let lastPrepareKey;
const doPreparation = (src, ignoreExports, context) => {
  const prepareKey = JSON.stringify({
    src: (src || []).sort(),
    ignoreExports: (ignoreExports || []).sort(),
    extensions: Array.from(getFileExtensions(context.settings)).sort(),
  });
  if (prepareKey === lastPrepareKey) {
    return;
  }

  importList.clear();
  exportList.clear();
  ignoredFiles.clear();
  filesOutsideSrc.clear();

  srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
  prepareImportsAndExports(srcFiles, context);
  determineUsage();
  lastPrepareKey = prepareKey;
};

const newNamespaceImportExists = (specifiers) => specifiers.some(({ type }) => type === IMPORT_NAMESPACE_SPECIFIER);

const newDefaultImportExists = (specifiers) => specifiers.some(({ type }) => type === IMPORT_DEFAULT_SPECIFIER);

const fileIsInPkg = (file) => {
  const { path, pkg } = readPkgUp({ cwd: file });
  const basePath = dirname(path);

  const checkPkgFieldString = (pkgField) => {
    if (join(basePath, pkgField) === file) {
      return true;
    }
  };

  const checkPkgFieldObject = (pkgField) => {
    const pkgFieldFiles = Object.values(pkgField).flatMap((value) => typeof value === 'boolean' ? [] : join(basePath, value));

    if (pkgFieldFiles.includes(file)) {
      return true;
    }
  };

  const checkPkgField = (pkgField) => {
    if (typeof pkgField === 'string') {
      return checkPkgFieldString(pkgField);
    }

    if (typeof pkgField === 'object') {
      return checkPkgFieldObject(pkgField);
    }
  };

  if (pkg.private === true) {
    return false;
  }

  if (pkg.bin) {
    if (checkPkgField(pkg.bin)) {
      return true;
    }
  }

  if (pkg.browser) {
    if (checkPkgField(pkg.browser)) {
      return true;
    }
  }

  if (pkg.main) {
    if (checkPkgFieldString(pkg.main)) {
      return true;
    }
  }

  return false;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid modules without exports, or exports without matching import in another module.',
      url: docsUrl('no-unused-modules'),
    },
    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            minLength: 1,
          },
        },
        ignoreExports: {
          description: 'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            minLength: 1,
          },
        },
        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean',
        },
        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean',
        },
        ignoreUnusedTypeExports: {
          description: 'ignore type exports without any usage',
          type: 'boolean',
        },
      },
      anyOf: [
        {
          properties: {
            unusedExports: { enum: [true] },
            src: {
              minItems: 1,
            },
          },
          required: ['unusedExports'],
        },
        {
          properties: {
            missingExports: { enum: [true] },
          },
          required: ['missingExports'],
        },
      ],
    }],
  },

  create(context) {
    const {
      src,
      ignoreExports = [],
      missingExports,
      unusedExports,
      ignoreUnusedTypeExports,
    } = context.options[0] || {};

    if (unusedExports) {
      doPreparation(src, ignoreExports, context);
    }

    const file = getPhysicalFilename(context);

    const checkExportPresence = (node) => {
      if (!missingExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      const exportCount = exportList.get(file);
      const exportAll = exportCount.get(EXPORT_ALL_DECLARATION);
      const namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER);

      exportCount.delete(EXPORT_ALL_DECLARATION);
      exportCount.delete(IMPORT_NAMESPACE_SPECIFIER);
      if (exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found');
      }
      exportCount.set(EXPORT_ALL_DECLARATION, exportAll);
      exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
    };

    const checkUsage = (node, exportedValue, isTypeExport) => {
      if (!unusedExports) {
        return;
      }

      if (isTypeExport && ignoreUnusedTypeExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      if (fileIsInPkg(file)) {
        return;
      }

      if (filesOutsideSrc.has(file)) {
        return;
      }

      // make sure file to be linted is included in source files
      if (!srcFiles.has(file)) {
        srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
        if (!srcFiles.has(file)) {
          filesOutsideSrc.add(file);
          return;
        }
      }

      exports = exportList.get(file);

      if (!exports) {
        console.error(`file \`${file}\` has no exports. Please update to the latest, and if it still happens, report this on https://github.com/import-js/eslint-plugin-import/issues/2866!`);
      }

      // special case: export * from
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
        if (exportAll.whereUsed.size > 0) {
          return;
        }
      }

      // special case: namespace import
      const namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);
      if (typeof namespaceImports !== 'undefined') {
        if (namespaceImports.whereUsed.size > 0) {
          return;
        }
      }

      // exportsList will always map any imported value of 'default' to 'ImportDefaultSpecifier'
      const exportsKey = exportedValue === DEFAULT ? IMPORT_DEFAULT_SPECIFIER : exportedValue;

      const exportStatement = exports.get(exportsKey);

      const value = exportsKey === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportsKey;

      if (typeof exportStatement !== 'undefined') {
        if (exportStatement.whereUsed.size < 1) {
          context.report(
            node,
            `exported declaration '${value}' not used within other modules`,
          );
        }
      } else {
        context.report(
          node,
          `exported declaration '${value}' not used within other modules`,
        );
      }
    };

    /**
     * only useful for tools like vscode-eslint
     *
     * update lists of existing exports during runtime
     */
    const updateExportUsage = (node) => {
      if (ignoredFiles.has(file)) {
        return;
      }

      let exports = exportList.get(file);

      // new module has been created during runtime
      // include it in further processing
      if (typeof exports === 'undefined') {
        exports = new Map();
      }

      const newExports = new Map();
      const newExportIdentifiers = new Set();

      node.body.forEach(({ type, declaration, specifiers }) => {
        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER);
        }
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach((specifier) => {
              if (specifier.exported) {
                newExportIdentifiers.add(specifier.exported.name || specifier.exported.value);
              }
            });
          }
          forEachDeclarationIdentifier(declaration, (name) => {
            newExportIdentifiers.add(name);
          });
        }
      });

      // old exports exist within list of new exports identifiers: add to map of new exports
      exports.forEach((value, key) => {
        if (newExportIdentifiers.has(key)) {
          newExports.set(key, value);
        }
      });

      // new export identifiers added: add to map of new exports
      newExportIdentifiers.forEach((key) => {
        if (!exports.has(key)) {
          newExports.set(key, { whereUsed: new Set() });
        }
      });

      // preserve information about namespace imports
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      let namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);

      if (typeof namespaceImports === 'undefined') {
        namespaceImports = { whereUsed: new Set() };
      }

      newExports.set(EXPORT_ALL_DECLARATION, exportAll);
      newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
      exportList.set(file, newExports);
    };

    /**
     * only useful for tools like vscode-eslint
     *
     * update lists of existing imports during runtime
     */
    const updateImportUsage = (node) => {
      if (!unusedExports) {
        return;
      }

      let oldImportPaths = importList.get(file);
      if (typeof oldImportPaths === 'undefined') {
        oldImportPaths = new Map();
      }

      const oldNamespaceImports = new Set();
      const newNamespaceImports = new Set();

      const oldExportAll = new Set();
      const newExportAll = new Set();

      const oldDefaultImports = new Set();
      const newDefaultImports = new Set();

      const oldImports = new Map();
      const newImports = new Map();
      oldImportPaths.forEach((value, key) => {
        if (value.has(EXPORT_ALL_DECLARATION)) {
          oldExportAll.add(key);
        }
        if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
          oldNamespaceImports.add(key);
        }
        if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
          oldDefaultImports.add(key);
        }
        value.forEach((val) => {
          if (
            val !== IMPORT_NAMESPACE_SPECIFIER
            && val !== IMPORT_DEFAULT_SPECIFIER
          ) {
            oldImports.set(val, key);
          }
        });
      });

      function processDynamicImport(source) {
        if (source.type !== 'Literal') {
          return null;
        }
        const p = resolve(source.value, context);
        if (p == null) {
          return null;
        }
        newNamespaceImports.add(p);
      }

      visit(node, visitorKeyMap.get(file), {
        ImportExpression(child) {
          processDynamicImport(child.source);
        },
        CallExpression(child) {
          if (child.callee.type === 'Import') {
            processDynamicImport(child.arguments[0]);
          }
        },
      });

      node.body.forEach((astNode) => {
        let resolvedPath;

        // support for export { value } from 'module'
        if (astNode.type === EXPORT_NAMED_DECLARATION) {
          if (astNode.source) {
            resolvedPath = resolve(astNode.source.raw.replace(/('|")/g, ''), context);
            astNode.specifiers.forEach((specifier) => {
              const name = specifier.local.name || specifier.local.value;
              if (name === DEFAULT) {
                newDefaultImports.add(resolvedPath);
              } else {
                newImports.set(name, resolvedPath);
              }
            });
          }
        }

        if (astNode.type === EXPORT_ALL_DECLARATION) {
          resolvedPath = resolve(astNode.source.raw.replace(/('|")/g, ''), context);
          newExportAll.add(resolvedPath);
        }

        if (astNode.type === IMPORT_DECLARATION) {
          resolvedPath = resolve(astNode.source.raw.replace(/('|")/g, ''), context);
          if (!resolvedPath) {
            return;
          }

          if (isNodeModule(resolvedPath)) {
            return;
          }

          if (newNamespaceImportExists(astNode.specifiers)) {
            newNamespaceImports.add(resolvedPath);
          }

          if (newDefaultImportExists(astNode.specifiers)) {
            newDefaultImports.add(resolvedPath);
          }

          astNode.specifiers
            .filter((specifier) => specifier.type !== IMPORT_DEFAULT_SPECIFIER && specifier.type !== IMPORT_NAMESPACE_SPECIFIER)
            .forEach((specifier) => {
              newImports.set(specifier.imported.name || specifier.imported.value, resolvedPath);
            });
        }
      });

      newExportAll.forEach((value) => {
        if (!oldExportAll.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(EXPORT_ALL_DECLARATION);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(EXPORT_ALL_DECLARATION);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(EXPORT_ALL_DECLARATION, { whereUsed });
          }
        }
      });

      oldExportAll.forEach((value) => {
        if (!newExportAll.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(EXPORT_ALL_DECLARATION);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(EXPORT_ALL_DECLARATION);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newDefaultImports.forEach((value) => {
        if (!oldDefaultImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_DEFAULT_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed });
          }
        }
      });

      oldDefaultImports.forEach((value) => {
        if (!newDefaultImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_DEFAULT_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newNamespaceImports.forEach((value) => {
        if (!oldNamespaceImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_NAMESPACE_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed });
          }
        }
      });

      oldNamespaceImports.forEach((value) => {
        if (!newNamespaceImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_NAMESPACE_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newImports.forEach((value, key) => {
        if (!oldImports.has(key)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(key);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(key);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(key, { whereUsed });
          }
        }
      });

      oldImports.forEach((value, key) => {
        if (!newImports.has(key)) {
          const imports = oldImportPaths.get(value);
          imports.delete(key);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(key);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });
    };

    return {
      'Program:exit'(node) {
        updateExportUsage(node);
        updateImportUsage(node);
        checkExportPresence(node);
      },
      ExportDefaultDeclaration(node) {
        checkUsage(node, IMPORT_DEFAULT_SPECIFIER, false);
      },
      ExportNamedDeclaration(node) {
        node.specifiers.forEach((specifier) => {
          checkUsage(specifier, specifier.exported.name || specifier.exported.value, false);
        });
        forEachDeclarationIdentifier(node.declaration, (name, isTypeExport) => {
          checkUsage(node, name, isTypeExport);
        });
      },
    };
  },
};
