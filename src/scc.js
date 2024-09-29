import calculateScc from '@rtsao/scc';
import { hashObject } from 'eslint-module-utils/hash';
import resolve from 'eslint-module-utils/resolve';
import ExportMapBuilder from './exportMap/builder';
import childContext from './exportMap/childContext';

let cache = new Map();

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
      parserOptions: context.parserOptions,
      parserPath: context.parserPath,
    }).digest('hex');
    const cacheKey = context.path + settingsHash;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const scc = StronglyConnectedComponentsBuilder.calculate(context);
    const visitedFiles = Object.keys(scc);
    visitedFiles.forEach((filePath) => cache.set(filePath + settingsHash, scc));
    return scc;
  }

  static calculate(context) {
    const exportMap = ExportMapBuilder.for(context);
    const adjacencyList = this.exportMapToAdjacencyList(exportMap);
    const calculatedScc = calculateScc(adjacencyList);
    return StronglyConnectedComponentsBuilder.calculatedSccToPlainObject(calculatedScc);
  }

  /** @returns {Map<string, Set<string>>} for each dep, what are its direct deps */
  static exportMapToAdjacencyList(initialExportMap) {
    const adjacencyList = new Map();
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
    // Fill gaps
    adjacencyList.forEach((values) => {
      values.forEach((value) => {
        if (!adjacencyList.has(value)) {
          adjacencyList.set(value, new Set());
        }
      });
    });
    return adjacencyList;
  }

  /** @returns {Record<string, number>} for each key, its SCC's index */
  static calculatedSccToPlainObject(sccs) {
    const obj = {};
    sccs.forEach((scc, index) => {
      scc.forEach((node) => {
        obj[node] = index;
      });
    });
    return obj;
  }
}
