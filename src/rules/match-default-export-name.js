import { camelCase } from 'camel-case'
import { pascalCase } from 'pascal-case'
import { snakeCase } from 'snake-case'
import Exports from '../ExportMap'
import importDeclaration from '../importDeclaration'
import docsUrl from '../docsUrl'

function getDefaultExportName(declaration, context, matchIgnore) {
  const imports = Exports.get(declaration.source.value, context)

  if (imports == null || matchIgnore(imports.path)) {
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

function applyCaseTransform(value, transform) {
  switch (transform) {
    case 'camelCase':
      return camelCase(value)
    case 'PascalCase':
      return pascalCase(value)
    case 'snake_case':
      return snakeCase(value)
    default:
      return value
  }
}

function stringToRegExp(string) {
  return /^\/.*\/$/.test(string)
    ? new RegExp(string.replace(/(^\/)|(\/$)/g, ''))
    : null
}

function createCustomDefaultExportNameGetter(overrides) {
  if (!Array.isArray(overrides)) {
    return () => null
  }

  const getCustomDefaultExportName = overrides.reduce((prevGetter, {
    module,
    name,
    transform,
  }) => {
    const moduleRegExp = stringToRegExp(module)
    const exec = moduleRegExp
      ? (moduleQuery) => {
        const result = moduleRegExp.exec(moduleQuery)

        return result ? result.slice(1) : null
      }
      : moduleQuery => moduleQuery === module ? [] : null
    const getter = (moduleQuery) => {
      const results = exec(moduleQuery)

      if (results) {
        return applyCaseTransform(
          name.replace(/(?:^|[^\\])\$(\d+)/g, (_, index) => results[parseInt(index, 10) - 1]),
          transform
        )
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

function createIngoreMathcer(ignore) {
  return ignore.reduce((prevMatcher, pattern) => {
    const patternRegExp = stringToRegExp(pattern)
    const matcher = patternRegExp
      ? (path) => patternRegExp.test(path)
      : (path) => path.indexOf(pattern) > -1

    if (prevMatcher) {
      return (path) => {
        const result = prevMatcher(path)

        if (result) {
          return true
        }

        return matcher(path)
      }
    }

    return matcher
  }, null)
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('match-default-export-name'),
    },
    schema: [
      {
        type: 'object',
        items: {
          ignore: {
            description: 'ignore matched files (defaults to ["/node_modules/"])',
            type: 'array',
            items: {
              description: 'string or RegExp',
              type: 'string',
            },
          },
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
                transform: {
                  description: 'transform default import name pattern to given case',
                  type: 'string',
                  enum: ['camelCase', 'PascalCase', 'snake_case'],
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
    const ignore = options.ignore || ['/node_modules/']
    const matchIgnore = createIngoreMathcer(ignore)
    const getCustomDefaultExportName = createCustomDefaultExportNameGetter(options.overrides)
    const checkDefault = (nameKey, expected, defaultSpecifier) => {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') {
        return
      }

      const declaration = importDeclaration(context)
      const customExportedName = getCustomDefaultExportName(declaration)
      const exportedName = customExportedName
        || getDefaultExportName(declaration, context, matchIgnore)

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
