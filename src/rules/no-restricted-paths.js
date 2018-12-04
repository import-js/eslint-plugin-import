import containsPath from 'contains-path'
import path from 'path'

import resolve from 'eslint-module-utils/resolve'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'

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

    function checkForRestrictedImportPath(importPath, node) {
        const absoluteImportPath = resolve(importPath, context)

        if (!absoluteImportPath) {
          return
        }

        matchingZones.forEach((zone) => {
          const absoluteFrom = path.resolve(basePath, zone.from)

          if (containsPath(absoluteImportPath, absoluteFrom)) {
            context.report({
              node,
              message: `Unexpected path "${importPath}" imported in restricted zone.`,
            })
          }
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
