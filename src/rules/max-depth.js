import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'

const DEFAULT_MAX = 0

const createError = (sourcePath, maxDepth, actualDepth) => (
  `Import '${sourcePath}' exceeds max nesting depth of ${maxDepth} (actual: ${actualDepth}).`
)

const checkDepth = (sourceValue, node, context) => {
  const {max = DEFAULT_MAX, overridePackages = {}} = context.options[0] || { }
  let packageMax = max

  if (/^\./.test(sourceValue)) {
    // skip relative paths
    return
  }

  let [pkgName, ...dirs] = sourceValue.split('/')

  // update variables for scoped packages
  if (/^@/.test(pkgName)) {
      pkgName = `${pkgName}/${dirs[0]}`
      dirs = dirs.slice(1)
  }

  if (pkgName in overridePackages) {
    packageMax = overridePackages[pkgName]
  }

  if (dirs.length > packageMax) {
      context.report({
          node,
          message: createError(sourceValue, packageMax, dirs.length),
      })
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('max-depth'),
    },
    schema: [
      {
          type: 'object',
          properties: {
              overridePackages: {
                  type: 'object',
                  patternProperties: {
                      '^[a-zA-Z-_@/]+$': {
                          type: 'integer',
                          minimum: 0,
                      },
                  },
                  additionalProperties: false,
              },
              max: {
                  type: 'integer',
                  minimum: 0,
              },
          },
          additionalProperties: false,
      },
    ],
  },

  create: context => {

    return {
      ImportDeclaration(node) {
        checkDepth(node.source.value, node.source, context)
      },
      CallExpression(node) {
        if (isStaticRequire(node)) {
            const [ requirePath ] = node.arguments
            checkDepth(requirePath.value, node, context)
        }
      },
    }
  },
}
