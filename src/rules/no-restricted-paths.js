import path from 'path';

import resolve from 'eslint-module-utils/resolve';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';
import importType from '../core/importType';

const containsPath = (filepath, target) => {
  const relative = path.relative(target, filepath);
  return relative === '' || !relative.startsWith('..');
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('no-restricted-paths'),
    },

    schema: [
      {
        type: 'object',
        properties: {
          zones: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                target: { type: 'string' },
                from: { type: 'string' },
                except: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: true,
                },
                message: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          basePath: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function noRestrictedPaths(context) {
    const options = context.options[0] || {};
    const restrictedPaths = options.zones || [];
    const basePath = options.basePath || process.cwd();
    const currentFilename = context.getFilename();
    const matchingZones = restrictedPaths.filter((zone) => {
      const targetPath = path.resolve(basePath, zone.target);

      return containsPath(currentFilename, targetPath);
    });

    function isValidExceptionPath(absoluteFromPath, absoluteExceptionPath) {
      const relativeExceptionPath = path.relative(absoluteFromPath, absoluteExceptionPath);

      return importType(relativeExceptionPath, context) !== 'parent';
    }

    function reportInvalidExceptionPath(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be descendants of the configured `from` path for that zone.',
      });
    }

    const zoneExceptions = matchingZones.map((zone) => {
      const exceptionPaths = zone.except || [];
      const absoluteFrom = path.resolve(basePath, zone.from);
      const absoluteExceptionPaths = exceptionPaths.map((exceptionPath) => path.resolve(absoluteFrom, exceptionPath));
      const hasValidExceptionPaths = absoluteExceptionPaths
        .every((absoluteExceptionPath) => isValidExceptionPath(absoluteFrom, absoluteExceptionPath));

      return {
        absoluteExceptionPaths,
        hasValidExceptionPaths,
      };
    });

    function checkForRestrictedImportPath(importPath, node) {
      const absoluteImportPath = resolve(importPath, context);

      if (!absoluteImportPath) {
        return;
      }

      matchingZones.forEach((zone, index) => {
        const absoluteFrom = path.resolve(basePath, zone.from);

        if (!containsPath(absoluteImportPath, absoluteFrom)) {
          return;
        }

        const { hasValidExceptionPaths, absoluteExceptionPaths } = zoneExceptions[index];

        if (!hasValidExceptionPaths) {
          reportInvalidExceptionPath(node);
          return;
        }

        const pathIsExcepted = absoluteExceptionPaths
          .some((absoluteExceptionPath) => containsPath(absoluteImportPath, absoluteExceptionPath));

        if (pathIsExcepted) {
          return;
        }

        context.report({
          node,
          message: `Unexpected path "{{importPath}}" imported in restricted zone.${zone.message ? ` ${zone.message}` : ''}`,
          data: { importPath },
        });
      });
    }

    return moduleVisitor((source) => {
      checkForRestrictedImportPath(source.value, source);
    }, { commonjs: true });
  },
};
