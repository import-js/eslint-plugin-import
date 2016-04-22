import path from 'path'
import resolve from '../core/resolve'
import endsWith from 'lodash.endswith'

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
    const resolvedPath = resolve(importPath, context)
    const extension = path.extname(resolvedPath).substring(1)

    if (!endsWith(importPath, extension)) {
      if (isUseOfExtensionEnforced(extension)) {
        context.report({
          node: source,
          message: `Missing file extension "${extension}" for "${importPath}"`,
        })
      }
    } else {
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
