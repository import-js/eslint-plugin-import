/**
 * @fileOverview Ensures that there are no useless path segments
 * @author Thomas Grainger
 */

import path from 'path'
import resolve from 'eslint-module-utils/resolve'
import moduleVisitor from 'eslint-module-utils/moduleVisitor'

function relative(from, to) {
  const rel = path.relative(from, to)
  return rel.startsWith('.') ? rel : `.${path.sep}${rel}`
}

module.exports = {
  meta: {},

  create: function (context) {
    const currentDir = path.dirname(context.getFilename())

    function checkSourceValue(source) {
      const { value } = source
      if (!value.startsWith('.')) {
        return
      }

      const resolvedPath = resolve(value, context)
      if (resolvedPath === undefined) {
        return
      }

      const expected = path.parse(relative(currentDir, resolvedPath))
      const valueParsed = path.parse(value)

      if (valueParsed.dir !== expected.dir) {
        const proposed = path.format({ dir: expected.dir, base: valueParsed.base })
        context.report({
          node: source,
          message: `Useless path segments for "${value}", should be "${proposed}"`,
        })
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
