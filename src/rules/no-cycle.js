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
    docs: { url: docsUrl('no-cycle') },
    schema: [optionsSchema],
  },

  create: function (context) {
    const myPath = context.getFilename()
    if (myPath === '<text>') return  // can't cycle-check a non-file

    function checkSourceValue(sourceNode, importer) {
      const imported = Exports.get(sourceNode.value, context)

      if (imported == null) {
        return  // no-unresolved territory
      }

      if (imported.path === myPath) {
        return  // no-self-import territory
      }

      const untraversed = [{imported, route:[]}]
      const traversed = new Set()
      function detectCycle({imported: m, route}) {
        if (traversed.has(m.path)) return
        traversed.add(m.path)

        for (let [path, { getter, source }] of m.imports) {
          if (path === myPath) return true
          if (traversed.has(path)) continue
          const deeper = getter()
          if (deeper != null) {
            untraversed.push({
              imported: deeper,
              route: route.concat(source),
            })
          }
        }
      }

      while (untraversed.length > 0) {
        const next = untraversed.shift() // bfs!
        if (detectCycle(next)) {
          const message = (next.route.length > 0
            ? `Dependency cycle via ${routeString(next.route)}`
            : 'Dependency cycle detected.')
          context.report(importer, message)
          return
        }
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}

function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>')
}
