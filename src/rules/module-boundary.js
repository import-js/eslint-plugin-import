import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';
import { dirname, relative, sep, resolve as pathResolve } from 'path';
import resolve from 'eslint-module-utils/resolve';
import { isExternalModule } from '../core/importType';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('module-boundary'),
    },
    schema: [makeOptionsSchema()],
  },

  create: function moduleBoundary(context) {
    const myPath = context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename();
    if (myPath === '<text>') return {}; // can't check a non-file

    function checkSourceValue(sourceNode) {
      const depPath = sourceNode.value;

      if (isExternalModule(depPath,context.settings, resolve(depPath, context), context)) {
        // don't handle external modules
        return;
      }

      const absDepPath = resolve(depPath, context);

      if (!absDepPath) { // unable to resolve path
        return;
      }

      const relDepPath = relative(dirname(myPath), absDepPath);
      const segments = relDepPath.split(sep); // Break down import path into path segments
      const currentPath = ['.']; // make sure relative path always starts with the current directory

      for (const path of segments) {
        currentPath.push(path);

        if (path === '..') {
          // don't check relative imports from parent
          continue;
        }

        const importPath = currentPath.join(sep);

        const resolvedImportFile = resolve(importPath, context);
        if (!resolvedImportFile) {
          continue;
        }

        if (absDepPath === resolvedImportFile) {
          // If resolved path is same as the one we're already tried to import, this is ok and we're done here
          break;
        }

        if (resolvedImportFile) {
          // One of the ascendant directories resolved to an index file
          const relativeImportPath = relative(dirname(myPath), resolvedImportFile);

          const normalisedRelativeImportPath = ['.', relativeImportPath].join(sep);
          if (normalisedRelativeImportPath.indexOf(importPath + sep) !== 0) {
            continue;
          }

          const recommendedImportPath = (relativeImportPath.indexOf('.') !== 0 ? '.' + sep : '') + relativeImportPath;

          context.report({
            node: sourceNode,
            message: 'Passing module boundary. Should import from `' + recommendedImportPath + '`.',
          });
          break;
        }
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0]);
  },
};
