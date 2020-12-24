import containsPath from 'contains-path'
import path from 'path'

import resolve from 'eslint-module-utils/resolve'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'
import importType from '../core/importType'

const allowedImportKindsSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
  uniqueItems: true,
}

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
                allowedImportKinds: allowedImportKindsSchema,
                message: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
          basePath: { type: 'string' },
          allowedImportKinds: allowedImportKindsSchema,
        },
        additionalProperties: false,
      },
    ],
  },

  create: function noRestrictedPaths(context) {
    const options = context.options[0] || {}
    const restrictedPaths = options.zones || []
    const basePath = options.basePath || process.cwd()
    const allowedImportKinds = options.allowedImportKinds || []
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

    function checkForRestrictedImportPath(importPathNode, importNode) {
        const absoluteImportPath = resolve(importPathNode.value, context)

        if (!absoluteImportPath) {
          return
        }

        matchingZones.forEach((zone) => {
          const exceptionPaths = zone.except || []
          const absoluteFrom = path.resolve(basePath, zone.from)

          if (!containsPath(absoluteImportPath, absoluteFrom)) {
            return
          }

          const absoluteExceptionPaths = exceptionPaths.map((exceptionPath) =>
            path.resolve(absoluteFrom, exceptionPath)
          )
          const hasValidExceptionPaths = absoluteExceptionPaths
            .every((absoluteExceptionPath) => isValidExceptionPath(absoluteFrom, absoluteExceptionPath))

          if (!hasValidExceptionPaths) {
            reportInvalidExceptionPath(importPathNode)
            return
          }

          const pathIsExcepted = absoluteExceptionPaths
            .some((absoluteExceptionPath) => containsPath(absoluteImportPath, absoluteExceptionPath))

          if (pathIsExcepted) {
            return
          }

          const typeIsExpected = (zone.allowedImportKinds || allowedImportKinds)
            .some((kind) => kind === importNode.importKind)

          if (typeIsExpected) {
            return
          }

          context.report({
            node: importPathNode,
            message: `Unexpected path "{{importPath}}" imported in restricted zone.${zone.message ? ` ${zone.message}` : ''}`,
            data: { importPath: importPathNode.value },
          })
        })
    }

    return {
      ImportDeclaration(node) {
        checkForRestrictedImportPath(node.source, node)
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
          const [ firstArgument ] = node.arguments

          checkForRestrictedImportPath(firstArgument, node)
        }
      },
    }
  },
}
