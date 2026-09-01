/**
 * @fileOverview Forbids a module from importing itself
 * @author Gio d'Amelio
 */

import { getPhysicalFilename } from 'eslint-module-utils/contextCompat';
import resolve from 'eslint-module-utils/resolve';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';

import docsUrl from '../docsUrl';

function isImportingSelf(context, node, requireName, moduleSystem) {
  const filePath = getPhysicalFilename(context);

  // If the input is from stdin, this test can't fail
  if (filePath !== '<text>' && filePath === resolve(requireName, context, moduleSystem)) {
    context.report({
      node,
      message: 'Module imports itself.',
    });
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Static analysis',
      description: 'Forbid a module from importing itself.',
      recommended: true,
      url: docsUrl('no-self-import'),
    },

    schema: [
      {
        type: 'object',
        properties: {
          requireResolve: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    return moduleVisitor((source, node, moduleSystem) => {
      isImportingSelf(context, node, source.value, moduleSystem);
    }, { commonjs: true, requireResolve: options.requireResolve });
  },
};
