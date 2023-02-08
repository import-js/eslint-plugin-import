import path from 'path';
import fs from 'fs';

import resolve from 'eslint-module-utils/resolve';
import { isBuiltIn, isExternalModule, isScoped } from '../core/importType';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

const enumValues = { enum: [ 'always', 'ignorePackages', 'never' ] };
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues },
};
const properties = {
  type: 'object',
  properties: {
    'pattern': patternProperties,
    'ignorePackages': { type: 'boolean' },
    'enforceEsmExtensions': { type: 'boolean' },
  },
};

function buildProperties(context) {

  const result = {
    defaultConfig: 'never',
    pattern: {},
    ignorePackages: false,
    enforceEsmExtensions: false,
  };

  context.options.forEach(obj => {

    // If this is a string, set defaultConfig to its value
    if (typeof obj === 'string') {
      result.defaultConfig = obj;
      return;
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (obj.pattern === undefined && obj.ignorePackages === undefined && obj.enforceEsmExtensions === undefined) {
      Object.assign(result.pattern, obj);
      return;
    }

    // If pattern is provided, transfer all props
    if (obj.pattern !== undefined) {
      Object.assign(result.pattern, obj.pattern);
    }

    // If ignorePackages is provided, transfer it to result
    if (obj.ignorePackages !== undefined) {
      result.ignorePackages = obj.ignorePackages;
    }
    // If enforceEsmExtensions is provided, transfer it to result
    if (obj.enforceEsmExtensions !== undefined) {
      result.enforceEsmExtensions = obj.enforceEsmExtensions;
    }
  });

  if (result.defaultConfig === 'ignorePackages') {
    result.defaultConfig = 'always';
    result.ignorePackages = true;
  }

  return result;
}

// util functions
const fileExists = function (filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  }
  catch (err) {
    if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
      // known and somewhat expected failure case.
      return false;
    }
    return false;
  }
};

const excludeParenthesisFromTokenLocation = function (token) {
  if (token.range == null || token.loc == null) {
    return token;
  }
  const rangeStart = token.range[0] + 1;
  const rangeEnd = token.range[1] - 1;
  const locColStart = token.loc.start.column + 1;
  const locColEnd = token.loc.end.column - 1;
  const newToken = {
    ...token,
    range: [rangeStart, rangeEnd],
    loc: {
      start: { ...token.loc.start, column: locColStart },
      end: { ...token.loc.end, column: locColEnd },
    },
  };

  return newToken;
};

const getEsmImportFixer = function (tokenLiteral, updated) {
  return function (fixer) {
    return fixer.replaceText(excludeParenthesisFromTokenLocation(tokenLiteral), updated);
  };
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Ensure consistent use of file extension within the import path.',
      url: docsUrl('extensions'),
    },
    fixable: 'code',
    schema: {
      anyOf: [
        {
          type: 'array',
          items: [enumValues],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [
            enumValues,
            properties,
          ],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [properties],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [patternProperties],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [
            enumValues,
            patternProperties,
          ],
          additionalItems: false,
        },
      ],
    },

    hasSuggestions: true,
  },

  create(context) {

    const props = buildProperties(context);

    function getModifier(extension) {
      return props.pattern[extension] || props.defaultConfig;
    }

    function isUseOfExtensionRequired(extension, isPackage) {
      return getModifier(extension) === 'always' && ((!props.ignorePackages || !isPackage) || props.enforceEsmExtensions) ;
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === 'never';
    }

    function isUseOfEsmImportsEnforced() {
      return props.enforceEsmExtensions === true;
    }

    function isResolvableWithoutExtension(file) {
      const extension = path.extname(file);
      const fileWithoutExtension = file.slice(0, -extension.length);
      const resolvedFileWithoutExtension = resolve(fileWithoutExtension, context);

      return resolvedFileWithoutExtension === resolve(file, context);
    }

    function isExternalRootModule(file) {
      const slashCount = file.split('/').length - 1;

      if (slashCount === 0)  return true;
      if (isScoped(file) && slashCount <= 1) return true;
      return false;
    }

    function getEsmExtensionReport(node) {

      const esmExtensions = ['.js', '.ts', '.mjs', '.cjs'];
      esmExtensions.push(...esmExtensions.map((ext) => `/index${ext}`));

      const importSource = node.source;
      const importedPath = importSource.value;
      const cwd = context.getCwd();
      const filename = context.getFilename();
      const relativeFilePath = path.relative(cwd, filename);
      const relativeSourceFileDir = path.dirname(relativeFilePath);
      const absoluteSourceFileDir = path.resolve(cwd, relativeSourceFileDir);
      const importedFileAbsolutePath = path.resolve(absoluteSourceFileDir, importedPath);
      const importOrExportLabel = node.type.match(/import/i) != null ? 'import of' : 'export from';
      let correctImportPath = null;
      try {
        for (let i = 0; i < esmExtensions.length; i++) {
          const ext = esmExtensions[i];
          const potentialImportPath = `${importedFileAbsolutePath}${ext}`;
          if (fileExists(potentialImportPath, context)) {
            correctImportPath = importedPath + ext;
            break;
          }
        }
      } catch (err) {
        return null;
      }
      if (correctImportPath == null) {
        return null;
      }

      if (correctImportPath.match(/^\./) == null) {
        correctImportPath = `./${correctImportPath}`;
      }
      const suggestionDesc = `Use "${correctImportPath}" instead.`;
      const fix = getEsmImportFixer(node.source, correctImportPath);

      return {
        message: `Invalid ESM ${importOrExportLabel} "${importedPath}". ${suggestionDesc}`,
        node,
        suggest: [
          {
            desc: suggestionDesc,
            fix,
          },
        ],
        fix,
      };
    }

    function checkFileExtension(source, node) {
      // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
      if (!source || !source.value) return;

      const importPathWithQueryString = source.value;

      // don't enforce anything on builtins
      if (isBuiltIn(importPathWithQueryString, context.settings)) return;

      const importPath = importPathWithQueryString.replace(/\?(.*)$/, '');

      // don't enforce in root external packages as they may have names with `.js`.
      // Like `import Decimal from decimal.js`)
      if (isExternalRootModule(importPath)) return;

      const resolvedPath = resolve(importPath, context);

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath).substring(1);

      // determine if this is a module
      const isPackage = isExternalModule(
        importPath,
        resolve(importPath, context),
        context,
      ) || isScoped(importPath);

      if (!extension || !importPath.endsWith(`.${extension}`)) {
        // ignore type-only imports and exports
        if (node.importKind === 'type' || node.exportKind === 'type') return;
        const extensionRequired = isUseOfExtensionRequired(extension, isPackage);
        const extensionForbidden = isUseOfExtensionForbidden(extension);
        if (extensionRequired && !extensionForbidden) {
          const esmExtensionsReport = isUseOfEsmImportsEnforced() ? getEsmExtensionReport(node) : null;
          if (esmExtensionsReport != null) {
            context.report(esmExtensionsReport);
          } else {
            context.report({
              node: source,
              message:
                `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPathWithQueryString}"`,
            });
          }
        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
          context.report({
            node: source,
            message: `Unexpected use of file extension "${extension}" for "${importPathWithQueryString}"`,
          });
        }
      }
    }

    return moduleVisitor(checkFileExtension, { commonjs: true });
  },
};
