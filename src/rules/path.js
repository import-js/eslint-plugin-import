import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import { dirname, relative, resolve } from 'path';
import docsUrl from '../docsUrl';
import ExportMap from '../ExportMap';

const relativeType = 'relative';
const absoluteType = 'absolute';
const pathTypes = [relativeType, absoluteType];
const defaultOptions = { underSameDirectory: relativeType, other: relativeType };

function underSameDirectory(reference, path) {
  const referenceDirectory = dirname(reference);
  const directory = dirname(path);
  return directory === referenceDirectory
    || directory.startsWith(`${referenceDirectory}/`)
    || directory.startsWith(`${referenceDirectory}\\`);
}

function getRelativePath(base, path, relativeToCurrent) {
  path = relative(base, path).replace(/\\/g, '/');
  if (relativeToCurrent && !path.startsWith('.')) {
    path = `./${path}`;
  }

  return path;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Style guide',
      description: 'Enforce a convention in import path.',
      url: docsUrl('path'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          underSameDirectory: {
            type: 'string',
            enum: pathTypes,
          },
          other: {
            type: 'string',
            enum: pathTypes,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    function reportInvalidPath(source) {
      const tsConfig = ExportMap.getTsConfig(context);
      const baseUrl = tsConfig && tsConfig.options ? tsConfig.options.baseUrl : undefined;
      const currentFilename = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
      const importPath = source.value;
      const isImportRelative = (/^\.\.?[/\\]/).test(importPath);
      const importFullPath = isImportRelative
        ? resolve(dirname(currentFilename), importPath)
        : resolve(baseUrl, importPath);
      const isUnderSameDirectory = underSameDirectory(currentFilename, importFullPath);
      const category = isUnderSameDirectory ? 'underSameDirectory' : 'other';
      const options = { ...defaultOptions, ...context.options[0] };
      const requiresRelative = options[category] === relativeType;
      if (requiresRelative !== isImportRelative) {
        let message = isUnderSameDirectory
          ? 'Imports under the same directory of the current file'
          : 'Imports not under the same directory of the current file';
        message += requiresRelative
          ? ' must be relative to the current file.'
          : ' must be relative to the project root.';
        context.report({
          node: source,
          message,
          fix(fixer) {
            const fixedPath = requiresRelative
              ? getRelativePath(dirname(currentFilename), importFullPath, true)
              : getRelativePath(baseUrl, importFullPath);
            return fixer.replaceText(source, JSON.stringify(fixedPath));
          },
        });
      }
    }

    const options = { ...defaultOptions, ...context.options[0] };
    return moduleVisitor(reportInvalidPath, options);
  },
};
