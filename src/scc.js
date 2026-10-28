import calculateScc from '@rtsao/scc';
import { hashObject } from 'eslint-module-utils/hash';
import resolve from 'eslint-module-utils/resolve';
import ExportMapBuilder from './exportMap/builder';
import childContext from './exportMap/childContext';

// One dependency graph per settings hash, shared by every linted file, so that a file is only ever expanded once.
let cache = new Map();

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export default class StronglyConnectedComponentsBuilder {
  static clearCache() {
    cache = new Map();
  }

  static get(source, context) {
    const path = resolve(source, context);
    if (path == null) { return null; }
    return StronglyConnectedComponentsBuilder.for(childContext(path, context));
  }

  static for(context) {
    const settingsHash = hashObject({
      settings: context.settings,
      parserOptions: context.parserOptions || context.languageOptions && context.languageOptions.parserOptions,
      parserPath: context.parserPath,
      languageOptions: context.languageOptions,
    }).digest('hex');
    if (!cache.has(settingsHash)) {
      cache.set(settingsHash, { adjacencyList: new Map(), scc: {}, sccCount: 0 });
    }
    const graph = cache.get(settingsHash);
    if (hasOwn(graph.scc, context.path)) {
      return graph.scc;
    }
    StronglyConnectedComponentsBuilder.calculate(context, graph);
    return graph.scc;
  }

  /**
   * Adds everything reachable from the context's file to the shared graph, and assigns an SCC to each new file.
   * Files already in `graph.scc` are final: they can only reach files that already have an SCC (otherwise those
   * files would have been reachable from them when they were added), so they can never share an SCC with a new file.
   * That lets us run the SCC algorithm over just the new files, instead of over the whole graph for every root.
   */
  static calculate(context, graph) {
    const exportMap = ExportMapBuilder.for(context);
    StronglyConnectedComponentsBuilder.exportMapToAdjacencyList(exportMap, graph.adjacencyList);
    if (!exportMap || !graph.adjacencyList.has(exportMap.path)) { return; }

    const unassigned = new Map();
    const toVisit = [exportMap.path];
    while (toVisit.length > 0) {
      const node = toVisit.pop();
      if (unassigned.has(node) || hasOwn(graph.scc, node)) { continue; }
      const dependencies = graph.adjacencyList.get(node) || new Set();
      unassigned.set(node, new Set([...dependencies].filter((dependency) => !hasOwn(graph.scc, dependency))));
      toVisit.push(...dependencies);
    }

    const calculatedScc = calculateScc(unassigned);
    StronglyConnectedComponentsBuilder.calculatedSccToPlainObject(calculatedScc, graph.scc, graph.sccCount);
    graph.sccCount += calculatedScc.length;
  }

  /** @returns {Map<string, Set<string>>} for each dep, what are its direct deps. Files without deps may have no entry. */
  static exportMapToAdjacencyList(initialExportMap, adjacencyList = new Map()) {
    // BFS
    function visitNode(exportMap) {
      if (!exportMap) {
        return;
      }
      exportMap.imports.forEach((v, importedPath) => {
        const from = exportMap.path;
        const to = importedPath;

        // Ignore type-only imports, because we care only about SCCs of value imports
        const toTraverse = [...v.declarations].filter(({ isOnlyImportingTypes }) => !isOnlyImportingTypes);
        if (toTraverse.length === 0) { return; }

        if (!adjacencyList.has(from)) {
          adjacencyList.set(from, new Set());
        }

        if (adjacencyList.get(from).has(to)) {
          return; // prevent endless loop
        }
        adjacencyList.get(from).add(to);
        visitNode(v.getter());
      });
    }
    visitNode(initialExportMap);
    return adjacencyList;
  }

  /** @returns {Record<string, number>} for each key, its SCC's index (plus `offset`) */
  static calculatedSccToPlainObject(sccs, obj = {}, offset = 0) {
    sccs.forEach((scc, index) => {
      scc.forEach((node) => {
        obj[node] = offset + index;
      });
    });
    return obj;
  }
}
