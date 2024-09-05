import { basename, dirname, relative } from 'path';
import { getPhysicalFilename } from 'eslint-module-utils/contextCompat';
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import resolve from 'eslint-module-utils/resolve';

import importType from '../core/importType';
import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Static analysis',
      description: 'Forbid importing modules from parent directories.',
      url: docsUrl('no-relative-parent-imports'),
    },
    schema: [makeOptionsSchema()],
  },

  create: function noRelativePackages(context) {
    const myPath = getPhysicalFilename(context);
    if (myPath === '<text>') { return {}; } // can't check a non-file

    function checkSourceValue(sourceNode) {
      const depPath = sourceNode.value;

      if (importType(depPath, context) === 'external') { // ignore packages
        return;
      }

      const absDepPath = resolve(depPath, context);

      if (!absDepPath) { // unable to resolve path
        return;
      }

      const relDepPath = relative(dirname(myPath), absDepPath);

      if (importType(relDepPath, context) === 'parent') {
        context.report({
          node: sourceNode,
          message: `Relative imports from parent directories are not allowed. Please either pass what you're importing through at runtime (dependency injection), move \`${basename(myPath)}\` to same directory as \`${depPath}\` or consider making \`${depPath}\` a package.`,
        });
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0]);
  },
};
