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

      const declaration = importDeclaration(context);

      const imports = ExportMapBuilder.get(declaration.source.value, context);
      if (imports == null) { return; }

      if (imports.errors.length) {
        imports.reportErrors(context, declaration);
        return;
      }

      if (imports.has('default') && imports.has(analyzedName)) {

        // #1594: the imported module exports the same thing via a default export and a named export
        const namedExportInImportedModule = imports.reexports.get(analyzedName);
        const defaultExportInImportedModule = imports.reexports.get('default');
        if (defaultExportInImportedModule.getImport().path === namedExportInImportedModule.getImport().path
          && defaultExportInImportedModule.local === namedExportInImportedModule.local) {
          return;
        }

        context.report(
          defaultSpecifier,
          `Using exported name '${defaultSpecifier[nameKey].name}' as identifier for default export.`,
        );

      }
    }
    return {
      ImportDefaultSpecifier: checkDefault.bind(null, 'local'),
      ExportDefaultSpecifier: checkDefault.bind(null, 'exported'),
    };
  },
};
