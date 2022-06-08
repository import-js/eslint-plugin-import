import path from 'path';

import resolve from 'eslint-module-utils/resolve';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import isGlob from 'is-glob';
import { Minimatch } from 'minimatch';
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
                target: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'array',
                      items: { type: 'string' },
                      uniqueItems: true,
                      minLength: 1,
                    },
                  ],
                },
                from: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'array',
                      items: { type: 'string' },
                      uniqueItems: true,
                      minLength: 1,
                    },
                  ],
                },
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
      return [].concat(zone.target)
        .map(target => path.resolve(basePath, target))
        .some(targetPath => isMatchingTargetPath(currentFilename, targetPath));
    });

    function isMatchingTargetPath(filename, targetPath) {
      if (isGlob(targetPath)) {
        const mm = new Minimatch(targetPath);
        return mm.match(filename);
      }

      return containsPath(filename, targetPath);
    }

    function isValidExceptionPath(absoluteFromPath, absoluteExceptionPath) {
      const relativeExceptionPath = path.relative(absoluteFromPath, absoluteExceptionPath);

      return importType(relativeExceptionPath, context) !== 'parent';
    }

    function areBothGlobPatternAndAbsolutePath(areGlobPatterns) {
      return areGlobPatterns.some((isGlob) => isGlob) && areGlobPatterns.some((isGlob) => !isGlob);
    }

    function reportInvalidExceptionPath(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be descendants of the configured `from` path for that zone.',
      });
    }

    function reportInvalidExceptionMixedGlobAndNonGlob(node) {
      context.report({
        node,
        message: 'Restricted path `from` must contain either only glob patterns or none',
      });
    }

    function reportInvalidExceptionGlob(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be glob patterns when `from` contains glob patterns',
      });
    }

    function computeMixedGlobAndAbsolutePathValidator() {
      return {
        isPathRestricted: () => true,
        hasValidExceptions: false,
        reportInvalidException: reportInvalidExceptionMixedGlobAndNonGlob,
      };
    }

    function computeGlobPatternPathValidator(absoluteFrom, zoneExcept) {
      let isPathException;

      const mm = new Minimatch(absoluteFrom);
      const isPathRestricted = (absoluteImportPath) => mm.match(absoluteImportPath);
      const hasValidExceptions = zoneExcept.every(isGlob);

      if (hasValidExceptions) {
        const exceptionsMm = zoneExcept.map((except) => new Minimatch(except));
        isPathException = (absoluteImportPath) => exceptionsMm.some((mm) => mm.match(absoluteImportPath));
      }

      const reportInvalidException = reportInvalidExceptionGlob;

      return {
        isPathRestricted,
        hasValidExceptions,
        isPathException,
        reportInvalidException,
      };
    }

    function computeAbsolutePathValidator(absoluteFrom, zoneExcept) {
      let isPathException;

      const isPathRestricted = (absoluteImportPath) => containsPath(absoluteImportPath, absoluteFrom);

      const absoluteExceptionPaths = zoneExcept
        .map((exceptionPath) => path.resolve(absoluteFrom, exceptionPath));
      const hasValidExceptions = absoluteExceptionPaths
        .every((absoluteExceptionPath) => isValidExceptionPath(absoluteFrom, absoluteExceptionPath));

      if (hasValidExceptions) {
        isPathException = (absoluteImportPath) => absoluteExceptionPaths.some(
          (absoluteExceptionPath) => containsPath(absoluteImportPath, absoluteExceptionPath),
        );
      }

      const reportInvalidException = reportInvalidExceptionPath;

      return {
        isPathRestricted,
        hasValidExceptions,
        isPathException,
        reportInvalidException,
      };
    }

    function reportInvalidExceptions(validators, node) {
      validators.forEach(validator => validator.reportInvalidException(node));
    }

    function reportImportsInRestrictedZone(validators, node, importPath, customMessage) {
      validators.forEach(() => {
        context.report({
          node,
          message: `Unexpected path "{{importPath}}" imported in restricted zone.${customMessage ? ` ${customMessage}` : ''}`,
          data: { importPath },
        });
      });
    }

    const makePathValidators = (zoneFrom, zoneExcept = []) => {
      const allZoneFrom = [].concat(zoneFrom);
      const areGlobPatterns = allZoneFrom.map(isGlob);

      if (areBothGlobPatternAndAbsolutePath(areGlobPatterns)) {
        return [computeMixedGlobAndAbsolutePathValidator()];
      }

      const isGlobPattern = areGlobPatterns.every((isGlob) => isGlob);

      return allZoneFrom.map(singleZoneFrom => {
        const absoluteFrom = path.resolve(basePath, singleZoneFrom);

        if (isGlobPattern) {
          return computeGlobPatternPathValidator(absoluteFrom, zoneExcept);
        }
        return computeAbsolutePathValidator(absoluteFrom, zoneExcept);
      });
    };

    const validators = [];

    function checkForRestrictedImportPath(importPath, node) {
      const absoluteImportPath = resolve(importPath, context);

      if (!absoluteImportPath) {
        return;
      }

      matchingZones.forEach((zone, index) => {
        if (!validators[index]) {
          validators[index] = makePathValidators(zone.from, zone.except);
        }

        const applicableValidatorsForImportPath = validators[index].filter(validator => validator.isPathRestricted(absoluteImportPath));

        const validatorsWithInvalidExceptions = applicableValidatorsForImportPath.filter(validator => !validator.hasValidExceptions);
        reportInvalidExceptions(validatorsWithInvalidExceptions, node);

        const applicableValidatorsForImportPathExcludingExceptions = applicableValidatorsForImportPath
          .filter(validator => validator.hasValidExceptions)
          .filter(validator => !validator.isPathException(absoluteImportPath));
        reportImportsInRestrictedZone(applicableValidatorsForImportPathExcludingExceptions, node, importPath, zone.message);
      });
    }

    return moduleVisitor((source) => {
      checkForRestrictedImportPath(source.value, source);
    }, { commonjs: true });
  },
};
