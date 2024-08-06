import ExportMapBuilder from '../exportMap/builder';
import importDeclaration from '../importDeclaration';
import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid use of exported name as identifier of default export.',
      url: docsUrl('no-named-as-default'),
    },
    schema: [],
  },

  create(context) {
    function checkDefault(nameKey, defaultSpecifier) {
      /**
       * For ImportDefaultSpecifier we're interested in the "local" name (`foo` for `import {bar as foo} ...`)
       * For ExportDefaultSpecifier we're interested in the "exported" name (`foo` for `export {bar as foo} ...`)
       */
      const analyzedName = defaultSpecifier[nameKey].name;

      // #566: default is a valid specifier
      if (analyzedName === 'default') { return; }

      const declaration = importDeclaration(context, defaultSpecifier);
      /** @type {import('../exportMap').default | null} */
      const importedModule = ExportMapBuilder.get(declaration.source.value, context);
      if (importedModule == null) { return; }

      if (importedModule.errors.length > 0) {
        importedModule.reportErrors(context, declaration);
        return;
      }

      if (!importedModule.hasDefault) {
        // The rule is triggered for default imports/exports, so if the imported module has no default
        // this means we're dealing with incorrect source code anyway
        return;
      }

      if (!importedModule.has(analyzedName)) {
        // The name used locally for the default import was not even used in the imported module.
        return;
      }

      /**
       * FIXME: We can verify if a default and a named export are pointing to the same symbol only
       * if they are both `reexports`. In case one of the symbols is not a re-export, but defined
       * in the file, the ExportMap structure has no info about what actually is being exported --
       * the value in the `namespace` Map is an empty object.
       *
       * To solve this, it would require not relying on the ExportMap, but on some other way of
       * accessing the imported module and its exported values.
       *
       * Additionally, although `ExportMap.get` is a unified way to get info from both `reexports`
       * and `namespace` maps, it does not return valid output we need here, and I think this is
       * related to the "cycle safeguards" in the `get` function.
       */

      if (importedModule.reexports.has(analyzedName) && importedModule.reexports.has('default')) {
        const thingImportedWithNamedImport = importedModule.reexports.get(analyzedName).getImport();
        const thingImportedWithDefaultImport = importedModule.reexports.get('default').getImport();

        // Case: both imports point to the same file and they both refer to the same symbol in this file.
        if (
          thingImportedWithNamedImport.path === thingImportedWithDefaultImport.path
          && thingImportedWithNamedImport.local === thingImportedWithDefaultImport.local
        ) {
          // #1594: the imported module exports the same thing via a default export and a named export
          return;
        }
      }

      context.report(
        defaultSpecifier,
        `Using exported name '${defaultSpecifier[nameKey].name}' as identifier for default ${nameKey === 'local' ? `import` : `export`}.`,
      );

    }

    return {
      ImportDefaultSpecifier: checkDefault.bind(null, 'local'),
      ExportDefaultSpecifier: checkDefault.bind(null, 'exported'),
    };
  },
};
