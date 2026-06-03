import path from 'path';

import minimatch from 'minimatch';
import resolve from 'eslint-module-utils/resolve';
import { getPhysicalFilename } from 'eslint-module-utils/contextCompat';
import { isBuiltIn, isExternalModule, isScoped } from '../core/importType';
import { getFilePackagePath } from '../core/packagePath';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

const enumValues = { enum: ['always', 'ignorePackages', 'never'] };
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues },
};
const properties = {
  type: 'object',
  properties: {
    pattern: patternProperties,
    checkTypeImports: { type: 'boolean' },
    ignorePackages: { type: 'boolean' },
    pathGroupOverrides: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
          },
          patternOptions: {
            type: 'object',
          },
          action: {
            type: 'string',
            enum: ['enforce', 'ignore'],
          },
        },
        additionalProperties: false,
        required: ['pattern', 'action'],
      },
    },
  },
};

function buildProperties(context) {

  const result = {
    defaultConfig: 'never',
    pattern: {},
    ignorePackages: false,
  };

  context.options.forEach((obj) => {

    // If this is a string, set defaultConfig to its value
    if (typeof obj === 'string') {
      result.defaultConfig = obj;
      return;
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (obj.pattern === undefined && obj.ignorePackages === undefined && obj.checkTypeImports === undefined) {
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

    if (obj.checkTypeImports !== undefined) {
      result.checkTypeImports = obj.checkTypeImports;
    }

    if (obj.pathGroupOverrides !== undefined) {
      result.pathGroupOverrides = obj.pathGroupOverrides;
    }
  });

  if (result.defaultConfig === 'ignorePackages') {
    result.defaultConfig = 'always';
    result.ignorePackages = true;
  }

  return result;
}

/**
 * A relative specifier that resolves to a directory which is itself a package
 * root (it has its own `package.json`) imports that package, not a file in the
 * current one, so `ignorePackages` should not require an extension for it.
 * https://github.com/import-js/eslint-plugin-import/issues/2844
 */
function isRelativeToPackage(importPath, context) {
  if (!(/^[.]{1,2}([\\/]|$)/).test(importPath)) {
    return false;
  }
  const physicalFilename = getPhysicalFilename(context);
  if (!physicalFilename || physicalFilename === '<text>') {
    return false;
  }
  const targetPath = path.resolve(path.dirname(physicalFilename), importPath);
  try {
    return getFilePackagePath(targetPath) === targetPath;
  } catch (e) {
    return false;
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Ensure consistent use of file extension within the import path.',
      url: docsUrl('extensions'),
    },

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
  },

  create(context) {

    const props = buildProperties(context);

    function getModifier(extension) {
      return props.pattern[extension] || props.defaultConfig;
    }

    function isUseOfExtensionRequired(extension, isPackage) {
      return getModifier(extension) === 'always' && (!props.ignorePackages || !isPackage);
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === 'never';
    }

    function isResolvableWithoutExtension(file, moduleSystem) {
      const extension = path.extname(file);
      const fileWithoutExtension = file.slice(0, -extension.length);
      const resolvedFileWithoutExtension = resolve(fileWithoutExtension, context, moduleSystem);

      return resolvedFileWithoutExtension === resolve(file, context, moduleSystem);
    }

    function isExternalRootModule(file) {
      if (file === '.' || file === '..') { return false; }
      const slashCount = file.split('/').length - 1;

      if (slashCount === 0)  { return true; }
      if (isScoped(file) && slashCount <= 1) { return true; }
      return false;
    }

    function computeOverrideAction(pathGroupOverrides, path) {
      for (let i = 0, l = pathGroupOverrides.length; i < l; i++) {
        const { pattern, patternOptions, action } = pathGroupOverrides[i];
        if (minimatch(path, pattern, patternOptions || { nocomment: true })) {
          return action;
        }
      }
    }

    function checkFileExtension(source, node, moduleSystem) {
      // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
      if (!source || !source.value) { return; }

      const importPathWithQueryString = source.value;

      // If not undefined, the user decided if rules are enforced on this import
      const overrideAction = computeOverrideAction(
        props.pathGroupOverrides || [],
        importPathWithQueryString,
      );

      if (overrideAction === 'ignore') {
        return;
      }

      // don't enforce anything on builtins
      if (!overrideAction && isBuiltIn(importPathWithQueryString, context.settings)) { return; }

      const importPath = importPathWithQueryString.replace(/\?(.*)$/, '');

      // don't enforce in root external packages as they may have names with `.js`.
      // Like `import Decimal from decimal.js`)
      if (!overrideAction && isExternalRootModule(importPath)) { return; }

      const resolvedPath = resolve(importPath, context, moduleSystem);

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath).substring(1);

      // determine if this is a module
      const isPackage = isExternalModule(
        importPath,
        resolve(importPath, context, moduleSystem),
        context,
      ) || isScoped(importPath)
        || isRelativeToPackage(importPath, context);

      if (!extension || !importPath.endsWith(`.${extension}`)) {
        // ignore type-only imports and exports
        if (!props.checkTypeImports && (node.importKind === 'type' || node.exportKind === 'type')) { return; }
        const extensionRequired = isUseOfExtensionRequired(extension, !overrideAction && isPackage);
        const extensionForbidden = isUseOfExtensionForbidden(extension);
        if (extensionRequired && !extensionForbidden) {
          context.report({
            node: source,
            message:
              `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPathWithQueryString}"`,
          });
        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath, moduleSystem)) {
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
