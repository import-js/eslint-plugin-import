import path from 'path'

import resolve from 'eslint-module-utils/resolve'
import { isBuiltIn, isExternalModuleMain, isScopedMain } from '../core/importType'

const enumValues = { enum: [ 'always', 'ignorePackages', 'never' ] }
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues },
}
const properties = {
  type: 'object',
  properties: { 
    'pattern': patternProperties,
    'ignorePackages': { type: 'boolean' },
  },
}

function buildProperties(context) {

    const result = {
      defaultConfig: 'never',
      pattern: {},
      ignorePackages: false,
    }

    context.options.forEach(obj => {

      // If this is a string, set defaultConfig to its value
      if (typeof obj === 'string') {
        result.defaultConfig = obj
        return
      }

      // If this is not the new structure, transfer all props to result.pattern
      if (obj.pattern === undefined && obj.ignorePackages === undefined) {
        Object.assign(result.pattern, obj)
        return
      }

      // If pattern is provided, transfer all props
      if (obj.pattern !== undefined) {
        Object.assign(result.pattern, obj.pattern)
      }

      // If ignorePackages is provided, transfer it to result
      if (obj.ignorePackages !== undefined) {
        result.ignorePackages = obj.ignorePackages
      }      
    })

    return result
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
          items: [
            enumValues, 
            properties,
          ],
          additionalItems: false,
        },
        {
          type: 'array',
          items: [properties],
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

    const props = buildProperties(context)
    
    function getModifier(extension) {
      return props.pattern[extension] || props.defaultConfig
    }

    function isUseOfExtensionRequired(extension, isPackageMain) {
      return getModifier(extension) === 'always' && (!props.ignorePackages || !isPackageMain)
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === 'never'
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

      // determine if this is a module
      const isPackageMain = 
        isExternalModuleMain(importPath, context.settings) || 
        isScopedMain(importPath)

      if (!extension || !importPath.endsWith(extension)) {
        const extensionRequired = isUseOfExtensionRequired(extension, isPackageMain)
        const extensionForbidden = isUseOfExtensionForbidden(extension)
        if (extensionRequired && !extensionForbidden) {
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
