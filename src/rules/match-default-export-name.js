import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'
import docsUrl from '../docsUrl'

function getDefaultExportName(declaration, context) {
  const imports = Exports.get(declaration.source.value, context)

  if (imports == null) {
    return null
  }

  if (imports.errors.length) {
    imports.reportErrors(context, declaration)
    return null
  }

  if (!imports.has('default')) {
    return null
  }

  return imports.get('default').identifierName
}

function createCustomDefaultExportNameGetter(overrides) {
  if (!Array.isArray(overrides)) {
    return () => null
  }

  const getCustomDefaultExportName = overrides.reduce((prevGetter, { module, name }) => {
    const moduleRegExp = /^\/.*\/$/.test(module)
      ? new RegExp(module.replace(/(^\/)|(\/$)/g, ''))
      : null
    const exec = moduleRegExp
      ? (moduleQuery) => {
        const result = moduleRegExp.exec(moduleQuery)

        return result ? result.slice(1) : null
      }
      : moduleQuery => moduleQuery === module ? [] : null
    const getter = (moduleQuery) => {
      const result = exec(moduleQuery)

      if (result) {
        return name.replace(/(?:^|[^\\])\$(\d+)/g, (_, index) => result[parseInt(index, 10) - 1])
      }

      return null
    }

    if (prevGetter) {
      return (moduleQuery) => {
        const prevResult = prevGetter(moduleQuery)

        if (prevResult) {
          return prevResult
        }

        return getter(moduleQuery)
      }
    }

    return getter
  }, null)

  return declaration => getCustomDefaultExportName(declaration.source.value)
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('match-default-export-name'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        items: {
          overrides: {
            description: 'custom default import names for specific modules',
            type: 'array',
            items: {
              description: 'override rule',
              type: 'object',
              properties: {
                module: {
                  description: 'module name to match '
                    + '(e. g. "react", "/styles\\.css$/", "/(\\w+)\\.module\\.css$/")',
                  type: 'string',
                },
                name: {
                  description: 'default import name pattern '
                    + '(e. g. "React", "styles", "$1Styles")',
                  type: 'string',
                },
              },
              required: ['module', 'name'],
            },
          },
        },
      },
    ],
  },

  create: function (context) {
    const options = context.options[0] || {}
    const getCustomDefaultExportName = createCustomDefaultExportNameGetter(options.overrides)
    const checkDefault = (nameKey, expected, defaultSpecifier) => {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') {
        return
      }

      const declaration = importDeclaration(context)
      const customExportedName = getCustomDefaultExportName(declaration)
      const exportedName = customExportedName || getDefaultExportName(declaration, context)

      if (exportedName) {
        const importedName = defaultSpecifier[nameKey].name

        if (exportedName && exportedName !== importedName) {
          context.report({
            node: defaultSpecifier,
            message: 'Expected ' + expected + ' \'' + importedName +
            (
              customExportedName
                ? '\' to match \''
                : '\' to match the default export \''
            ) + exportedName +
            '\'.',
            fix: fixer => fixer.replaceText(defaultSpecifier[nameKey], exportedName),
          })
        }
      }
    }

    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local', 'import'),
      'ExportDefaultSpecifier': checkDefault.bind(null, 'exported', 'export'),
    }
  },
}
