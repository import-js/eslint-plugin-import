export function captureDependency(
  { source },
  isOnlyImportingTypes,
  remotePathResolver,
  exportMap,
  context,
  thunkFor,
  importedSpecifiers = new Set(),
) {
  if (source == null) { return null; }

  const p = remotePathResolver.resolve(source.value);
  if (p == null) { return null; }

  const declarationMetadata = {
    // capturing actual node reference holds full AST in memory!
    source: { value: source.value, loc: source.loc },
    isOnlyImportingTypes,
    importedSpecifiers,
  };

  const existing = exportMap.imports.get(p);
  if (existing != null) {
    existing.declarations.add(declarationMetadata);
    return existing.getter;
  }

  const getter = thunkFor(p, context);
  exportMap.imports.set(p, { getter, declarations: new Set([declarationMetadata]) });
  return getter;
}

const supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);

export function captureDependencyWithSpecifiers(
  n,
  remotePathResolver,
  exportMap,
  context,
  thunkFor,
) {
  // import type { Foo } (TS and Flow); import typeof { Foo } (Flow)
  const declarationIsType = n.importKind === 'type' || n.importKind === 'typeof';
  // import './foo' or import {} from './foo' (both 0 specifiers) is a side effect and
  // shouldn't be considered to be just importing types
  let specifiersOnlyImportingTypes = n.specifiers.length > 0;
  const importedSpecifiers = new Set();
  n.specifiers.forEach((specifier) => {
    if (specifier.type === 'ImportSpecifier') {
      importedSpecifiers.add(specifier.imported.name || specifier.imported.value);
    } else if (supportedImportTypes.has(specifier.type)) {
      importedSpecifiers.add(specifier.type);
    }

    // import { type Foo } (Flow); import { typeof Foo } (Flow)
    specifiersOnlyImportingTypes = specifiersOnlyImportingTypes
      && (specifier.importKind === 'type' || specifier.importKind === 'typeof');
  });
  captureDependency(n, declarationIsType || specifiersOnlyImportingTypes, remotePathResolver, exportMap, context, thunkFor, importedSpecifiers);
}
