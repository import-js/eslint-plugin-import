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
      Object.defineProperty(exportMeta, 'namespace', {
        get() { return namespace.resolveImport(nsource); },
      });
      exportMap.namespace.set(specifier.exported.name, exportMeta);
      return;
    case 'ExportAllDeclaration':
      Object.defineProperty(exportMeta, 'namespace', {
        get() { return namespace.resolveImport(specifier.source.value); },
      });
      exportMap.namespace.set(
        specifier.exported.name || specifier.exported.value,
        exportMeta,
      );
      return;
    case 'ExportSpecifier':
      if (!astNode.source) {
        namespace.add(exportMeta, specifier.local);
        exportMap.namespace.set(
          specifier.exported.name || specifier.exported.value,
          exportMeta,
        );
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
