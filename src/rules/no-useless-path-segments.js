/**
 * @fileOverview Ensures that there are no useless path segments
 * @author Thomas Grainger
 */

import path from 'path'
import sumBy from 'lodash/sumBy'
import resolve from 'eslint-module-utils/resolve'
import moduleVisitor from 'eslint-module-utils/moduleVisitor'
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
  meta: {
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
  },

  create: function (context) {
    const currentDir = path.dirname(context.getFilename())

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

      const resolvedPath = resolve(value, context)
      const normed = normalize(value)
      if (normed !== value && resolvedPath === resolve(normed, context)) {
        return report(normed)
      }

      if (value.startsWith('./')) {
        return
      }

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
