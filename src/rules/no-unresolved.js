/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */

import resolve, { CASE_SENSITIVE_FS, fileExistsWithCaseSync } from 'eslint-module-utils/resolve';
import ModuleCache from 'eslint-module-utils/ModuleCache';
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('no-unresolved'),
    },

    schema: [
      makeOptionsSchema({
        ts: { type: 'boolean', default: false },
        caseSensitive: { type: 'boolean', default: true },
        caseSensitiveStrict: { type: 'boolean', default: false },
      }),
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    function checkSourceValue(source, node) {
      // ignore type-only imports
      if (node.importKind === 'type') {
        return;
      }

      const caseSensitive = !CASE_SENSITIVE_FS && options.caseSensitive !== false;
      const caseSensitiveStrict = !CASE_SENSITIVE_FS && options.caseSensitiveStrict;
      const useTS = options.ts;

      let resolvedPath = resolve(source.value, context);
      if (useTS) {
        resolvedPath = resolvedPath ||
          resolve(source.value.replace(/\.js$/, '.ts'), context) ||
          resolve(source.value.replace(/\.jsx$/, '.tsx'), context);
      }


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
