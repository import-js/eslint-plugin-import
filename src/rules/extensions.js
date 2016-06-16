import path from 'path'
import endsWith from 'lodash.endswith'

import resolve from '../core/resolve'
import { isBuiltIn } from '../core/importType'

module.exports = function (context) {
  const configuration = context.options[0] || 'never'

  function isUseOfExtensionEnforced(extension) {
    if (typeof configuration === 'object') {
      return configuration[extension] === 'always'
    }

    return configuration === 'always'
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
      if (isUseOfExtensionEnforced(extension)) {
        context.report({
          node: source,
          message:
            `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPath}"`,
        })
      }
    } else if (extension) {
      if (!isUseOfExtensionEnforced(extension) && isResolvableWithoutExtension(importPath)) {
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

module.exports.schema = [
  {
    oneOf: [
      {
        enum: [ 'always', 'never' ],
      },
      {
        type: 'object',
        patternProperties: {
          '.*': { enum: [ 'always', 'never' ] },
        },
      },
    ],
  },
]
