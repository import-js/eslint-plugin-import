import path from 'path'
import endsWith from 'lodash.endswith'

import resolve from '../core/resolve'
import { isBuiltIn } from '../core/importType'

const has = Object.prototype.hasOwnProperty;

module.exports = function (context) {
  const configuration = context.options[0] || 'never'
  const defaultConfig = typeof configuration === 'string' ? configuration : null
  const modifiers = typeof configuration === 'object' ? configuration : context.options[1] || {}

  function isUseOfExtensionRequired(extension) {
    return (has.call(modifiers, extension) || defaultConfig) === 'always'
  }

  function isUseOfExtensionForbidden(extension) {
    return (has.call(modifiers, extension) || defaultConfig) === 'never'
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

    if (!extension || !endsWith(importPath, extension)) {
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
}

const enumValues = { enum: [ 'always', 'never' ] }
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues },
}

module.exports.schema = {
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
}
