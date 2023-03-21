/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

import resolve, { fileExistsWithCaseSync } from 'eslint-module-utils/resolve';
import ModuleCache from 'eslint-module-utils/ModuleCache';
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Static analysis',
      description: 'Ensure imports point to a file/module that can be resolved.',
      url: docsUrl('no-unresolved'),
    },

    schema: [
      makeOptionsSchema({
        caseSensitive: { type: 'boolean', default: true },
        caseSensitiveStrict: { type: 'boolean', default: false },
      }),
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    function checkSourceValue(source, node) {
      // ignore type-only imports and exports
      if (node.importKind === 'type' || node.exportKind === 'type') {
        return;
      }

      const caseSensitive = options.caseSensitive !== false;
      const caseSensitiveStrict = options.caseSensitiveStrict;

      const resolvedPath = resolve(source.value, context);

      if (resolvedPath === undefined) {
        context.report(
          source,
          `Unable to resolve path to module '${source.value}'.`,
        );
      } else if (caseSensitive || caseSensitiveStrict) {
        const cacheSettings = ModuleCache.getSettings(context.settings);
        if (!fileExistsWithCaseSync(resolvedPath, cacheSettings, caseSensitiveStrict)) {
          context.report(
            source,
            `Casing of ${source.value} does not match the underlying filesystem.`,
          );
        }
      }
    }

    return moduleVisitor(checkSourceValue, options);
  },
};
