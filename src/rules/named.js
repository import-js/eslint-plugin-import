import * as path from 'path';
import Exports from '../ExportMap';
import docsUrl from '../docsUrl';
import isIgnored from '../../utils/ignore';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('named'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          commonjs: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    function checkSpecifiers(key, type, node) {
      if (node.source && isIgnored(node.source.value, context)) {
        return;
      }

      // ignore local exports and type imports/exports
      if (
        node.source == null
        || node.importKind === 'type'
        || node.importKind === 'typeof'
        || node.exportKind === 'type'
      ) {
        return;
      }

      if (!node.specifiers.some((im) => im.type === type)) {
        return; // no named imports/exports
      }

      const imports = Exports.get(node.source.value, context);
      if (imports == null) {
        return;
      }

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        if (
          im.type !== type
          // ignore type imports
          || im.importKind === 'type' || im.importKind === 'typeof'
        ) {
          return;
        }

        const deepLookup = imports.hasDeep(im[key].name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path
              .map(i => path.relative(path.dirname(context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename()), i.path))
              .join(' -> ');

            context.report(im[key], `${im[key].name} not found via ${deepPath}`);
          } else {
            context.report(im[key], im[key].name + ' not found in \'' + node.source.value + '\'');
          }
        }
      });
    }

    function checkRequire(node) {
      if (
        !options.commonjs
        || node.type !== 'VariableDeclarator'
        // return if it's not an object destructure or it's an empty object destructure
        || !node.id || node.id.type !== 'ObjectPattern' || node.id.properties.length === 0
        // return if there is no call expression on the right side
        || !node.init || node.init.type !== 'CallExpression'
      ) {
        return;
      }

      const call = node.init;
      const [source] = call.arguments;
      const variableImports = node.id.properties;
      const variableExports = Exports.get(source.value, context);

      if (
        // return if it's not a commonjs require statement
        call.callee.type !== 'Identifier' || call.callee.name !== 'require' || call.arguments.length !== 1
        // return if it's not a string source
        || source.type !== 'Literal'
        || variableExports == null
      ) {
        return;
      }

      if (variableExports.errors.length) {
        variableExports.reportErrors(context, node);
        return;
      }

      variableImports.forEach(function (im) {
        if (im.type !== 'Property' || !im.key || im.key.type !== 'Identifier') {
          return;
        }

        const deepLookup = variableExports.hasDeep(im.key.name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path
              .map(i => path.relative(path.dirname(context.getFilename()), i.path))
              .join(' -> ');

            context.report(im.key, `${im.key.name} not found via ${deepPath}`);
          } else {
            context.report(im.key, im.key.name + ' not found in \'' + source.value + '\'');
          }
        }
      });
    }

    return {
      ImportDeclaration: checkSpecifiers.bind(null, 'imported', 'ImportSpecifier'),

      ExportNamedDeclaration: checkSpecifiers.bind(null, 'local', 'ExportSpecifier'),

      VariableDeclarator: checkRequire,
    };
  },
};
