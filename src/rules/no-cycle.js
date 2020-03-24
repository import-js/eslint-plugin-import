/**
 * @fileOverview Ensures that no imported module imports the linted module.
 * @author Ben Mosher
 */

import resolve from 'eslint-module-utils/resolve';
import Exports from '../ExportMap';
import { isExternalModule } from '../core/importType';
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

// todo: cache cycles / deep relationships for faster repeat evaluation
module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: docsUrl('no-cycle') },
    schema: [makeOptionsSchema({
      maxDepth: {
        oneOf: [
          {
            description: 'maximum dependency depth to traverse',
            type: 'integer',
            minimum: 1,
          },
          {
            enum: ['∞'],
            type: 'string',
          },
        ],
      },
      ignoreExternal: {
        description: 'ignore external modules',
        type: 'boolean',
        default: false,
      },
    })],
  },

  create: function (context) {
    const myPath = context.getFilename();
    if (myPath === '<text>') return {}; // can't cycle-check a non-file

    const options = context.options[0] || {};
    const maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity;
    const ignoreModule = (name) => options.ignoreExternal && isExternalModule(
      name,
      context.settings,
      resolve(name, context),
      context
    );

    function checkSourceValue(sourceNode, importer) {
      if (ignoreModule(sourceNode.value)) {
        return; // ignore external modules
      }

      if (
        importer.type === 'ImportDeclaration' && (
          // import type { Foo } (TS and Flow)
          importer.importKind === 'type' ||
          // import { type Foo } (Flow)
          importer.specifiers.every(({ importKind }) => importKind === 'type')
        )
      ) {
        return; // ignore type imports
      }

      const imported = Exports.get(sourceNode.value, context);

      if (imported == null) {
        return;  // no-unresolved territory
      }

      if (imported.path === myPath) {
        return;  // no-self-import territory
      }

      const untraversed = [{ mget: () => imported, route:[] }];
      const traversed = new Set();
      function detectCycle({ mget, route }) {
        const m = mget();
        if (m == null) return;
        if (traversed.has(m.path)) return;
        traversed.add(m.path);

        for (const [path, { getter, declarations }] of m.imports) {
          if (path === myPath) return true;
          if (traversed.has(path)) continue;
          for (const { source, isOnlyImportingTypes } of declarations) {
            if (ignoreModule(source.value)) continue;
            // Ignore only type imports
            if (isOnlyImportingTypes) continue;

            if (route.length + 1 < maxDepth) {
              untraversed.push({
                mget: getter,
                route: route.concat(source),
              });
            }
          }
        }
      }

      while (untraversed.length > 0) {
        const next = untraversed.shift(); // bfs!
        if (detectCycle(next)) {
          const message = (next.route.length > 0
            ? `Dependency cycle via ${routeString(next.route)}`
            : 'Dependency cycle detected.');
          context.report(importer, message);
          return;
        }
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0]);
  },
};

function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>');
}
