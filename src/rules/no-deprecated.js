import declaredScope from 'eslint-module-utils/declaredScope';
import Exports from '../ExportMap';
import docsUrl from '../docsUrl';
import namespaceValidator from '../core/namespaceValidator';

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.');
}

function getDeprecation(metadata) {
  if (!metadata || !metadata.doc) return;

  return metadata.doc.tags.find(t => t.title === 'deprecated');
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid imported names marked with `@deprecated` documentation tag.',
      url: docsUrl('no-deprecated'),
    },
    schema: [],
  },

  create(context) {
    const deprecated = new Map();
    const namespaces = new Map();

    function checkSpecifiers(node) {
      if (node.type !== 'ImportDeclaration') return;
      if (node.source == null) return; // local export, ignore

      const imports = Exports.get(node.source.value, context);
      if (imports == null) return;

      const moduleDeprecation = imports.doc && imports.doc.tags.find(t => t.title === 'deprecated');
      if (moduleDeprecation) {
        context.report({ node, message: message(moduleDeprecation) });
      }

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        let imported; let local;
        switch (im.type) {


        case 'ImportNamespaceSpecifier':{
          if (!imports.size) return;
          namespaces.set(im.local.name, imports);
          return;
        }

        case 'ImportDefaultSpecifier':
          imported = 'default';
          local = im.local.name;
          break;

        case 'ImportSpecifier':
          imported = im.imported.name;
          local = im.local.name;
          break;

        default: return; // can't handle this one
        }

        // unknown thing can't be deprecated
        const exported = imports.get(imported);
        if (exported == null) return;

        // capture import of deep namespace
        if (exported.namespace) namespaces.set(local, exported.namespace);

        const deprecation = getDeprecation(imports.get(imported));
        if (!deprecation) return;

        context.report({ node: im, message: message(deprecation) });

        deprecated.set(local, deprecation);

      });
    }

    return {
      'Program': ({ body }) => body.forEach(checkSpecifiers),

      'Identifier': function (node) {
        if (node.parent.type === 'MemberExpression' && node.parent.property === node) {
          return; // handled by MemberExpression
        }

        // ignore specifier identifiers
        if (node.parent.type.slice(0, 6) === 'Import') return;

        if (!deprecated.has(node.name)) return;

        if (declaredScope(context, node.name) !== 'module') return;
        context.report({
          node,
          message: message(deprecated.get(node.name)),
        });
      },

      'MemberExpression': function (dereference) {
        if (dereference.object.type !== 'Identifier') return;
        if (!namespaces.has(dereference.object.name)) return;

        if (declaredScope(context, dereference.object.name) !== 'module') return;

        function onDeprecation(context){
          return function inner(node, exported) {
            const deprecation = getDeprecation(exported);

            if (deprecation) {
              context.report({ node: node.property, message: message(deprecation) });
            }
          };
        }

        function onComputed() {
          // ignore computed parts for now
          return arguments[2];
        }

        namespaceValidator(
          dereference,
          namespaces,
          onComputed,
          { onDeprecation: onDeprecation(context) },
        );
      },
    };
  },
};
