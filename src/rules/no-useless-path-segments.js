/**
 * @fileOverview Ensures that there are no useless path segments
 * @author Thomas Grainger
 */

import moduleVisitor from 'eslint-module-utils/moduleVisitor'
import resolve from 'eslint-module-utils/resolve'
import path from 'path'
import docsUrl from '../docsUrl'

/**
 * convert a potentially relative path from node utils into a true
 * relative path.
 *
 * ../ -> ..
 * ./ -> .
 * .foo/bar -> ./.foo/bar
 * ..foo/bar -> ./..foo/bar
 * foo/bar -> ./foo/bar
 *
 * @param relativePath {string} relative posix path potentially missing leading './'
 * @returns {string} relative posix path that always starts with a ./
 **/
function toRelativePath(relativePath) {
  const stripped = relativePath.replace(/\/$/g, '') // Remove trailing /

  return /^((\.\.)|(\.))($|\/)/.test(stripped) ? stripped : `./${stripped}`
}

function normalize(fn) {
  return toRelativePath(path.posix.normalize(fn))
}

const countRelativeParents = (pathSegments) => pathSegments.reduce(
  (sum, pathSegment) => pathSegment === '..' ? sum + 1 : sum, 0
)

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-useless-path-segments'),
    },

    schema: [
      {
        type: 'object',
        properties: {
          commonjs: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],

    fixable: 'code',
    messages: {
      uselessPath: 'Useless path segments for "{{ path }}", should be "{{ proposedPath }}"',
    },
  },

  create(context) {
    const currentDir = path.dirname(context.getFilename())
    const config = context.options[0]

    function checkSourceValue(source) {
      const { value: importPath } = source

      function report(proposedPath) {
        context.report({
          node: source,
          messageId: 'uselessPath',
          data: {
            path: importPath,
            proposedPath,
          },
          fix: fixer => fixer.replaceText(source, JSON.stringify(proposedPath)),
        })
      }

      // Only relative imports are relevant for this rule --> Skip checking
      if (!importPath.startsWith('.')) {
        return
      }

      // Report rule violation if path is not the shortest possible
      const resolvedPath = resolve(importPath, context)
      const normedPath = normalize(importPath)
      const resolvedNormedPath = resolve(normedPath, context)
      if (normedPath !== importPath && resolvedPath === resolvedNormedPath) {
        return report(normedPath)
      }

      // Path is shortest possible + starts from the current directory --> Return directly
      if (importPath.startsWith('./')) {
        return
      }

      // Path is not existing --> Return directly (following code requires path to be defined)
      if (resolvedPath === undefined) {
        return
      }

      const expected = path.relative(currentDir, resolvedPath) // Expected import path
      const expectedSplit = expected.split(path.sep) // Split by / or \ (depending on OS)
      const importPathSplit = importPath.replace(/^\.\//, '').split('/')
      const countImportPathRelativeParents = countRelativeParents(importPathSplit)
      const countExpectedRelativeParents = countRelativeParents(expectedSplit)
      const diff = countImportPathRelativeParents - countExpectedRelativeParents

      // Same number of relative parents --> Paths are the same --> Return directly
      if (diff <= 0) {
        return
      }

      // Report and propose minimal number of required relative parents
      return report(
        toRelativePath(
          importPathSplit
            .slice(0, countExpectedRelativeParents)
            .concat(importPathSplit.slice(countImportPathRelativeParents + diff))
            .join('/')
        )
      )
    }

    return moduleVisitor(checkSourceValue, config)
  },
}
