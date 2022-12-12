/**
 * @fileOverview Ensures that no imported module imports the linted module.
 * @author Ben Mosher
 */

import resolve from 'eslint-module-utils/resolve';
import Exports from '../ExportMap';
import { isExternalModule } from '../core/importType';
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

const traversed = new Set();
/** 
 * Cache of resolved paths for faster subsequent lookups
 * @type {{ [importPath: string]: string }} 
 */
const resolvedPaths = {};
/** 
 * Cache of external module evaluations for faster subsequent lookups
 * @type {{ [resolvedPath: string]: boolean }} 
 */
const externalModules = {};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Static analysis',
      description: 'Forbid a module from importing a module with a dependency path back to itself.',
      url: docsUrl('no-cycle'),
    },
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
      allowUnsafeDynamicCyclicDependency: {
        description: 'Allow cyclic dependency if there is at least one dynamic import in the chain',
        type: 'boolean',
        default: false,
      },
    })],
  },

  create(context) {
    const myPath = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
    if (myPath === '<text>') return {}; // can't cycle-check a non-file

    const options = context.options[0] || {};
    const maxDepth = typeof options.maxDepth === 'number' ? options.maxDepth : Infinity;
    
    const ignoreModule = (name) => {
      // Note: This fn is optimized to eliminate call time because it may be
      // called hundreds of thousands of times during a full repository lint run
      // and can add minutes to the total time in large codebases

      // Low cost evaluation; do not ignore if not opted in or module starts
      // with a relative path
      // NOTE: skipping further resolve codepath also ensures that only unique
      // import paths are set in resolvedPaths, eg "./index.js", or "../file.js"
      // should not be stored because there could be duplicates that resolve to
      // different paths
      if (!options.ignoreExternal || name[0] === '.') return false;

      // High cost evaluation; cache evaluations of resolve() and
      // isExternalModule() calls for faster subsequent lookups
      let path = resolvedPaths[name];
      if (path === undefined) {
        path = resolve(name, context);
        resolvedPaths[name] = path;
      }

      let isExternal = externalModules[path];
      if (isExternal === undefined) {
        isExternal = isExternalModule(name, path, context);
        externalModules[path] = isExternal;
      }
      
      return isExternal;
    };

    function checkSourceValue(sourceNode, importer) {
      if (ignoreModule(sourceNode.value)) {
        return; // ignore external modules
      }
      if (options.allowUnsafeDynamicCyclicDependency && (
        // Ignore `import()`
        importer.type === 'ImportExpression' ||
        // `require()` calls are always checked (if possible)
        (importer.type === 'CallExpression' && importer.callee.name !== 'require'))) {
        return; // cycle via dynamic import allowed by config
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
      function detectCycle({ mget, route }) {
        const m = mget();
        if (m == null) return;
        if (traversed.has(m.path)) return;
        traversed.add(m.path);

        for (const [path, { getter, declarations }] of m.imports) {
          if (traversed.has(path)) continue;
          const toTraverse = [...declarations].filter(({ source, isOnlyImportingTypes }) =>
            !ignoreModule(source.value) &&
            // Ignore only type imports
            !isOnlyImportingTypes,
          );

          /*
          If cyclic dependency is allowed via dynamic import, skip checking if any module is imported dynamically
          */
          if (options.allowUnsafeDynamicCyclicDependency && toTraverse.some(d => d.dynamic)) return;

          /*
          Only report as a cycle if there are any import declarations that are considered by
          the rule. For example:

          a.ts:
          import { foo } from './b' // should not be reported as a cycle

          b.ts:
          import type { Bar } from './a'
          */
          if (path === myPath && toTraverse.length > 0) return true;
          if (route.length + 1 < maxDepth) {
            for (const { source } of toTraverse) {
              untraversed.push({ mget: getter, route: route.concat(source) });
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

    return Object.assign(moduleVisitor(checkSourceValue, context.options[0]), {
      'Program:exit': () => {
        traversed.clear();
      },
    });
  },
};

function routeString(route) {
  return route.map(s => `${s.value}:${s.loc.start.line}`).join('=>');
}
