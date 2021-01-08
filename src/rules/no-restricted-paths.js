import containsPath from 'contains-path'
import path from 'path'
import minimatch from 'minimatch'
import isGlob from 'is-glob'

import resolve from 'eslint-module-utils/resolve'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'
import importType from '../core/importType'

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
    const options = context.options[0] || {}
    const restrictedPaths = options.zones || []
    const basePath = options.basePath || process.cwd()
    const currentFilename = context.getFilename()
    const matchingZones = restrictedPaths.filter((zone) => {
      const targetPath = path.resolve(basePath, zone.target)

      return containsPath(currentFilename, targetPath)
    })

    function isValidExceptionPath(absoluteFromPath, absoluteExceptionPath) {
      const relativeExceptionPath = path.relative(absoluteFromPath, absoluteExceptionPath)

      return importType(relativeExceptionPath, context) !== 'parent'
    }

    function reportInvalidExceptionPath(node) {
      context.report({
        node,
        message: 'Restricted path exceptions must be descendants of the configured `from` path for that zone.',
      })
    }

    function checkForRestrictedImportPath(importPath, node) {
        const absoluteImportPath = resolve(importPath, context)

        if (!absoluteImportPath) {
          return
        }

        matchingZones.forEach((zone) => {
          const exceptions = zone.except || []
          const absoluteFrom = path.resolve(basePath, zone.from)
          let exceptionPaths = []
          let exceptionGlobs = []

          exceptions.forEach(exception => {
            if (isGlob(exception)) {
              exceptionGlobs.push(exception)
            } else {
              exceptionPaths.push(exception)
            }
          })


          if (!containsPath(absoluteImportPath, absoluteFrom)) {
            return
          }

          // exception globs
          const relativeImportFromFrom = absoluteImportPath.replace(absoluteFrom, '')
          const pathIsExceptedByExceptionGlob = exceptionGlobs.some((exceptionGlob) =>
            minimatch(relativeImportFromFrom, exceptionGlob)
          )

          if (pathIsExceptedByExceptionGlob) {
            return
          }

          // exception paths
          const absoluteExceptionPaths = exceptionPaths.map((exceptionPath) =>
            path.resolve(absoluteFrom, exceptionPath)
          )
          const hasValidExceptionPaths = absoluteExceptionPaths
            .every((absoluteExceptionPath) => isValidExceptionPath(absoluteFrom, absoluteExceptionPath))

          if (!hasValidExceptionPaths) {
            reportInvalidExceptionPath(node)
            return
          }

          const pathIsExceptedByExceptionPath = absoluteExceptionPaths
            .some((absoluteExceptionPath) => containsPath(absoluteImportPath, absoluteExceptionPath))

          if (pathIsExceptedByExceptionPath) {
            return
          }

          context.report({
            node,
            message: `Unexpected path "{{importPath}}" imported in restricted zone.${zone.message ? ` ${zone.message}` : ''}`,
            data: { importPath },
          })
        })
    }

    return {
      ImportDeclaration(node) {
        checkForRestrictedImportPath(node.source.value, node.source)
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
          const [ firstArgument ] = node.arguments

          checkForRestrictedImportPath(firstArgument.value, firstArgument)
        }
      },
    }
  },
}
