import path from 'path';

import resolve from 'eslint-module-utils/resolve';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import isGlob from 'is-glob';
import { Minimatch, default as minimatch } from 'minimatch';
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
    const currentFilename = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
    const matchingZones = restrictedPaths.filter((zone) => {
      const targetPath = path.resolve(basePath, zone.target);

      if (isGlob(targetPath)) {
        return minimatch(currentFilename, targetPath);
      }

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

    function reportInvalidExceptionGlob(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be glob patterns when `from` is a glob pattern',
      });
    }

    const makePathValidator = (zoneFrom, zoneExcept = []) => {
      const absoluteFrom = path.resolve(basePath, zoneFrom);
      const isGlobPattern = isGlob(zoneFrom);
      let isPathRestricted;
      let hasValidExceptions;
      let isPathException;
      let reportInvalidException;

      if (isGlobPattern) {
        const mm = new Minimatch(absoluteFrom);
        isPathRestricted = (absoluteImportPath) => mm.match(absoluteImportPath);

        hasValidExceptions = zoneExcept.every(isGlob);

        if (hasValidExceptions) {
          const exceptionsMm = zoneExcept.map((except) => new Minimatch(except));
          isPathException = (absoluteImportPath) => exceptionsMm.some((mm) => mm.match(absoluteImportPath));
        }

        reportInvalidException = reportInvalidExceptionGlob;
      } else {
        isPathRestricted = (absoluteImportPath) => containsPath(absoluteImportPath, absoluteFrom);

        const absoluteExceptionPaths = zoneExcept
          .map((exceptionPath) => path.resolve(absoluteFrom, exceptionPath));
        hasValidExceptions = absoluteExceptionPaths
          .every((absoluteExceptionPath) => isValidExceptionPath(absoluteFrom, absoluteExceptionPath));

        if (hasValidExceptions) {
          isPathException = (absoluteImportPath) => absoluteExceptionPaths.some(
            (absoluteExceptionPath) => containsPath(absoluteImportPath, absoluteExceptionPath),
          );
        }

        reportInvalidException = reportInvalidExceptionPath;
      }

      return {
        isPathRestricted,
        hasValidExceptions,
        isPathException,
        reportInvalidException,
      };
    };

    const validators = [];

    function checkForRestrictedImportPath(importPath, node) {
      const absoluteImportPath = resolve(importPath, context);

      if (!absoluteImportPath) {
        return;
      }

      matchingZones.forEach((zone, index) => {
        if (!validators[index]) {
          validators[index] = makePathValidator(zone.from, zone.except);
        }

        const {
          isPathRestricted,
          hasValidExceptions,
          isPathException,
          reportInvalidException,
        } = validators[index];

        if (!isPathRestricted(absoluteImportPath)) {
          return;
        }

        if (!hasValidExceptions) {
          reportInvalidException(node);
          return;
        }

        const pathIsExcepted = isPathException(absoluteImportPath);
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
