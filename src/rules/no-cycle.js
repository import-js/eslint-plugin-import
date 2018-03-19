/**
 * @fileOverview Ensures that no imported module imports the linted module.
 * @author Ben Mosher
 */

import Exports from '../ExportMap'
import moduleVisitor, { optionsSchema } from 'eslint-module-utils/moduleVisitor'
import docsUrl from '../docsUrl'

// todo: cache cycles / deep relationships for faster repeat evaluation
module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-cycle'),
    },

    schema: [optionsSchema],
  },

  create: function (context) {

    const myPath = context.getFilename()

    function checkSourceValue(source) {
      const imported = Exports.get(source.value, context)

      if (imported === undefined) {
        return // no-unresolved territory
      }

      if (imported.path === myPath) {
        // todo: report direct self import?
        return
      }

      const untraversed = [imported]
      const traversed = new Set()
      function detectCycle(m) {
        if (traversed.has(m.path)) return
        traversed.add(m.path)

        for (let [path, getter] of m.imports) {
          if (path === context) return true
          if (traversed.has(path)) continue
          untraversed.push(getter())
        }
      }

      while (untraversed.length > 0) {
        if (detectCycle(untraversed.pop())) {
          // todo: report

          // todo: cache

          return
        }
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
