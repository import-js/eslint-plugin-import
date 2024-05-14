export default function processSpecifier(specifier, astNode, exportMap, namespace) {
  const nsource = astNode.source && astNode.source.value;
  const exportMeta = {};
  let local;

  switch (specifier.type) {
    case 'ExportDefaultSpecifier':
      if (!nsource) { return; }
      local = 'default';
      break;
    case 'ExportNamespaceSpecifier':
      exportMap.namespace.set(specifier.exported.name, Object.defineProperty(exportMeta, 'namespace', {
        get() { return namespace.resolveImport(nsource); },
      }));
      return;
    case 'ExportAllDeclaration':
      exportMap.namespace.set(specifier.exported.name || specifier.exported.value, namespace.add(exportMeta, specifier.source.value));
      return;
    case 'ExportSpecifier':
      if (!astNode.source) {
        exportMap.namespace.set(specifier.exported.name || specifier.exported.value, namespace.add(exportMeta, specifier.local));
        return;
      }
    // else falls through
    default:
      local = specifier.local.name;
      break;
  }

  // todo: JSDoc
  exportMap.reexports.set(specifier.exported.name, { local, getImport: () => namespace.resolveImport(nsource) });
}
