import path from 'path';

import minimatch from 'minimatch';
import resolve from 'eslint-module-utils/resolve';
import { isBuiltIn, isExternalModule, isScoped } from '../core/importType';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';
import has from 'has';

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

    function isResolvableWithoutExtension(file) {
      const extension = path.extname(file);
      const fileWithoutExtension = file.slice(0, -extension.length);
      const resolvedFileWithoutExtension = resolve(fileWithoutExtension, context);

      return resolvedFileWithoutExtension === resolve(file, context);
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

    function checkFileExtension(source, node) {
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

      const resolvedPath = resolve(importPath, context);

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath).slice(1);

      // determine if this is a module
      const isPackage = isExternalModule(
        importPath,
        resolve(importPath, context),
        context,
      ) || isScoped(importPath);

      const validExtensions = getValidExtensionFor(context, importPath, extension);
      if (!extension || !validExtensions.some((extension) => importPath.endsWith(`.${extension}`))) {
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

/**
 * Taken from `eslint-import-resolver-typescript`.
 * This could be imported from current versions of that plugin,
 * but this project still depends on an older version.
 * Also, importing it would add a dependency, or at least an
 * optional peer dependency - copying the code seems like the
 * more sane option.
 * [LICENSE](https://github.com/import-js/eslint-import-resolver-typescript/blob/71b23a206514842fef70a99220e5ffb1d6da2a0e/LICENSE)
 */
const defaultExtensionAlias = {
  '.js': [
    '.ts',
    // `.tsx` can also be compiled as `.js`
    '.tsx',
    '.d.ts',
    '.js',
  ],
  '.jsx': ['.tsx', '.d.ts', '.jsx'],
  '.cjs': ['.cts', '.d.cts', '.cjs'],
  '.mjs': ['.mts', '.d.mts', '.mjs'],
};

function getValidExtensionFor(context, importPath, resolvedExtension) {
  let extensionAlias = {};
  if (context.settings['import/resolver']  && context.settings['import/resolver'].typescript) {
    extensionAlias = context.settings['import/resolver'].typescript.extensionAlias || defaultExtensionAlias;
  }

  const importedExtension = path.extname(importPath);
  if (has(extensionAlias, importedExtension)) {
    return extensionAlias[importedExtension].map((ext) => ext.slice(1));
  }
  return [resolvedExtension];
}

