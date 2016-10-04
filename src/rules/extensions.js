import path from 'path'
import has from 'has'

import resolve from 'eslint-module-utils/resolve'
import { isBuiltIn } from '../core/importType'

const enumValues = { enum: [ 'always', 'never' ] }
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues },
}

module.exports = {
  meta: {
    docs: {},

    schema: {
      anyOf: [
        {
          type: 'array',
          items: [enumValues],
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

  create: function (context) {
    const configuration = context.options[0] || 'never'
    const defaultConfig = typeof configuration === 'string' ? configuration : null
    const modifiers = Object.assign(
      {},
      typeof configuration === 'object' ? configuration : context.options[1]
    )

    function isUseOfExtensionRequired(extension) {
      if (!has(modifiers, extension)) { modifiers[extension] = defaultConfig }
      return modifiers[extension] === 'always'
    }

    function isUseOfExtensionForbidden(extension) {
      if (!has(modifiers, extension)) { modifiers[extension] = defaultConfig }
      return modifiers[extension] === 'never'
    }

    function isResolvableWithoutExtension(file) {
      const extension = path.extname(file)
      const fileWithoutExtension = file.slice(0, -extension.length)
      const resolvedFileWithoutExtension = resolve(fileWithoutExtension, context)

      return resolvedFileWithoutExtension === resolve(file, context)
    }

    function checkFileExtension(node) {
      const { source } = node
      const importPath = source.value

      // don't enforce anything on builtins
      if (isBuiltIn(importPath, context.settings)) return

      const resolvedPath = resolve(importPath, context)

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = path.extname(resolvedPath || importPath).substring(1)

      if (!extension || !importPath.endsWith(extension)) {
        if (isUseOfExtensionRequired(extension) && !isUseOfExtensionForbidden(extension)) {
          context.report({
            node: source,
            message:
              `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPath}"`,
          })
        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
          context.report({
            node: source,
            message: `Unexpected use of file extension "${extension}" for "${importPath}"`,
          })
        }
      }
    }

    return {
      ImportDeclaration: checkFileExtension,
    }
  },
}
