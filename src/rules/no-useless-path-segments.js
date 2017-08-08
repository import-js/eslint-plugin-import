/**
 * @fileOverview Ensures that there are no useless path segments
 * @author Thomas Grainger
 */

import path from 'path'
import sumBy from 'lodash.sumby'
import resolve from 'eslint-module-utils/resolve'
import moduleVisitor from 'eslint-module-utils/moduleVisitor'

function toRel(rel, sep) {
  return rel.startsWith(`..${sep}`) ? rel : `.${sep}${rel}`
}

function normalize(fn, sep) {
  return toRel(path.normalize(fn), sep)
}

const countRelParent = x => sumBy(x, v => v === '..')

module.exports = {
  meta: {},

  create: function (context) {
    const currentDir = path.dirname(context.getFilename())

    function checkSourceValue(source) {
      const { value } = source

      function report(proposed) {
        context.report({
          node: source,
          message: `Useless path segments for "${value}", should be "${proposed}"`,
        })
      }

      if (!value.startsWith('.')) {
        return
      }

      const normed = normalize(value, '/')
      if (normed !== value) {
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
          .join('/'), '/')
      )
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
