import minimatch from 'minimatch'

import resolve from 'eslint-module-utils/resolve'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-internal-modules'),
    },

    schema: [
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
    ],
  },

  create: function noReachingInside(context) {
    const options = context.options[0] || {}
    const allowRegexps = (options.allow || []).map(p => minimatch.makeRe(p))

    // test if reaching to this destination is allowed
    function reachingAllowed(importPath) {
      return allowRegexps.some(re => re.test(importPath))
    }

    // minimatch patterns are expected to use / path separators, like import
    // statements, so normalize paths to use the same
    function normalizeSep(somePath) {
      return somePath.split('\\').join('/')
    }

    // find a directory that is being reached into, but which shouldn't be
    function isReachViolation(importPath) {
      const steps = normalizeSep(importPath)
        .split('/')
        .reduce((acc, step) => {
          if (!step || step === '.') {
            return acc
          } else if (step === '..') {
            return acc.slice(0, -1)
          } else {
            return acc.concat(step)
          }
        }, [])

      const nonScopeSteps = steps.filter(step => step.indexOf('@') !== 0)
      if (nonScopeSteps.length <= 1) return false

      // before trying to resolve, see if the raw import (with relative
      // segments resolved) matches an allowed pattern
      const justSteps = steps.join('/')
      if (reachingAllowed(justSteps) || reachingAllowed(`/${justSteps}`)) return false

      // if the import statement doesn't match directly, try to match the
      // resolved path if the import is resolvable
      const resolved = resolve(importPath, context)
      if (!resolved || reachingAllowed(normalizeSep(resolved))) return false

      // this import was not allowed by the allowed paths, and reaches
      // so it is a violation
      return true
    }

    function checkImportForReaching(importPath, node) {
      const potentialViolationTypes = ['parent', 'index', 'sibling', 'external', 'internal']
      if (potentialViolationTypes.indexOf(importType(importPath, context)) !== -1 &&
        isReachViolation(importPath)
      ) {
        context.report({
          node,
          message: `Reaching to "${importPath}" is not allowed.`,
        })
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
  },
}
