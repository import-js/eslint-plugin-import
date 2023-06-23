import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import { dirname, relative, resolve } from 'path';
import docsUrl from '../docsUrl';
import ExportMap from '../ExportMap';

const relativeToCurrent = 'relativeToCurrent';
const relativeToRoot = 'relativeToRoot';
const pathTypes = [relativeToCurrent, relativeToRoot];
const defaultOptions = { underSameDirectory: relativeToCurrent, other: relativeToCurrent };

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
          root: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    function reportInvalidPath(source) {
      const options = { ...defaultOptions, ...context.options[0] };
      const tsConfig = ExportMap.getTsConfig(context);
      const baseUrl = tsConfig && tsConfig.options ? tsConfig.options.baseUrl : undefined;
      const root = options.root
        ? options.root
        : baseUrl
          ? baseUrl
          : undefined;
      const importPath = source.value;
      const isRelativeToCurrent = (/^\.\.?[/\\]/).test(importPath);
      if (!isRelativeToCurrent && !root) {
        context.report({
          node: source,
          message: 'Imports cannot be relative to the project root because the project root is not defined.',
        });
      } else {
        const currentFilename = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
        const importFullPath = isRelativeToCurrent
          ? resolve(dirname(currentFilename), importPath)
          : resolve(root, importPath);
        const isUnderSameDirectory = underSameDirectory(currentFilename, importFullPath);
        const category = isUnderSameDirectory ? 'underSameDirectory' : 'other';
        const requiresRelativeToCurrent = options[category] === relativeToCurrent;
        if (requiresRelativeToCurrent !== isRelativeToCurrent) {
          let message = isUnderSameDirectory
            ? 'Imports under the same directory of the current file'
            : 'Imports not under the same directory of the current file';
          message += requiresRelativeToCurrent
            ? ' must be relative to the current file.'
            : ' must be relative to the project root.';
          context.report({
            node: source,
            message,
            fix(fixer) {
              const fixedPath = requiresRelativeToCurrent
                ? getRelativePath(dirname(currentFilename), importFullPath, true)
                : getRelativePath(root, importFullPath);
              return fixer.replaceText(source, JSON.stringify(fixedPath));
            },
          });
        }
      }
    }

    const options = { ...defaultOptions, ...context.options[0] };
    return moduleVisitor(reportInvalidPath, options);
  },
};
