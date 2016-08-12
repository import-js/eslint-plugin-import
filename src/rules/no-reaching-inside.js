import path from 'path'
import find from 'lodash.find'
import minimatch from 'minimatch'

import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

module.exports = function noReachingInside(context) {
  const options = context.options[0] || {}
  const dirname = path.dirname(context.getFilename())
  const allowRegexps = (options.allow || []).map(p => minimatch.makeRe(p))

  // test if reaching into this directory is allowed by the
  // config, '/' is automatically added so that globs like
  // "lodash/**" will match both "lodash" (which requires the trailing /) and "lodash/get"
  function reachingAllowed(someDir) {
    return !!find(allowRegexps, re => re.test(someDir) || re.test(someDir + '/'))
  }

  function isRelativeStep (step) {
    return step === '' || step === '.' || step === '..'
  }

  function normalizeSep(somePath) {
    return somePath.split('\\').join('/')
  }

  function report(reachedTo, node) {
    context.report({
      node,
      message: `Reaching into "${normalizeSep(reachedTo)}" is not allowed.`,
    })
  }

  function findNotAllowedReach(importPath, startingBase, join, ignoreStep) {
    const steps = normalizeSep(importPath).split('/').filter(Boolean)

    let parentDir = startingBase
    while (steps.length) {
      const step = steps.shift()
      parentDir = normalizeSep(join(parentDir, step))

      if (ignoreStep && ignoreStep(step)) {
        continue
      }
      if (steps.length && !reachingAllowed(parentDir)) {
        return parentDir
      }
    }
  }

  function checkRelativeImportForReaching(importPath, node) {
    const reachedInto = findNotAllowedReach(importPath, dirname, path.resolve, isRelativeStep)
    if (reachedInto) {
      report(path.relative(dirname, reachedInto), node)
    }
  }

  function checkAbsoluteImportForReaching(importPath, node) {
    const reachedInto = findNotAllowedReach(importPath, '', path.join)
    if (reachedInto) {
      report(reachedInto, node)
    }
  }

  function checkImportForReaching(importPath, node) {
    switch (importType(importPath, context)) {
      case 'parent':
      case 'index':
      case 'sibling':
        return checkRelativeImportForReaching(importPath, node)

      case 'external':
      case 'internal':
        return checkAbsoluteImportForReaching(importPath, node)
      default:
        return
    }
  }

  return {
    ImportDeclaration(node) {
      checkImportForReaching(node.source.value, node.source)
    },
    CallExpression(node) {
      if (isStaticRequire(node)) {
        const [ firstArgument ] = node.arguments
        checkImportForReaching(firstArgument.value, firstArgument)
      }
    },
  }
}

module.exports.schema = [
  {
    type: 'object',
    properties: {
      allow: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    additionalProperties: false,
  },
]
