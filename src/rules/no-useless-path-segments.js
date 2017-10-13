/**
 * @fileOverview Ensures that there are no useless path segments
 * @author Thomas Grainger
 */

import path from 'path'
import sumBy from 'lodash.sumby'
import resolve from 'eslint-module-utils/resolve'
import moduleVisitor from 'eslint-module-utils/moduleVisitor'

/**
 * convert a potentialy relative path from node utils into a true
 * relative path.
 *
 * ../ -> ..
 * ./ -> .
 * .foo/bar -> ./.foo/bar
 * ..foo/bar -> ./..foo/bar
 * foo/bar -> ./foo/bar
 *
 * @param rel {string} relative posix path potentially missing leading './'
 * @returns {string} relative posix path that always starts with a ./
 **/
function toRel(rel) {
  const stripped = rel.replace(/\/$/g, '')
  return /^((\.\.)|(\.))($|\/)/.test(stripped) ? stripped : `./${stripped}`
}

function normalize(fn) {
  return toRel(path.posix.normalize(fn))
}

const countRelParent = x => sumBy(x, v => v === '..')

module.exports = {
  meta: { fixable: 'code' },

  create: function (context) {
    const currentDir = path.dirname(context.getFilename())
    const resolvesToSameModule = (path1, path2) => {
      try {
        return require.resolve((path1)) === require.resolve((path2))
      } catch(e) {
        return true
      }
    }

    function checkSourceValue(source) {
      const { value } = source

      function report(proposed) {
        context.report({
          node: source,
          message: `Useless path segments for "${value}", should be "${proposed}"`,
          fix: fixer => fixer.replaceText(source, JSON.stringify(proposed)),
        })
      }

      if (!value.startsWith('.')) {
        return
      }

      const normed = normalize(value)
      if (normed !== value && resolvesToSameModule(value, normed)) {
        return report(normed)
      }

      if (value.startsWith('./')) {
        return
      }

      const resolvedPath = resolve(value, context)
      if (resolvedPath === undefined) {
        return
      }

      const expected = path.relative(currentDir, resolvedPath)
      const expectedSplit = expected.split(path.sep)
      const valueSplit = value.replace(/^\.\//, '').split('/')
      const valueNRelParents = countRelParent(valueSplit)
      const expectedNRelParents = countRelParent(expectedSplit)
      const diff = valueNRelParents - expectedNRelParents

      if (diff <= 0) {
        return
      }

      return report(
        toRel(valueSplit
          .slice(0, expectedNRelParents)
          .concat(valueSplit.slice(valueNRelParents + diff))
          .join('/'))
      )
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
