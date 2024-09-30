/**
 * @fileOverview Report modules that could parse incorrectly as scripts.
 * @author Ben Mosher
 */

import { isModule } from 'eslint-module-utils/unambiguous';
import docsUrl from '../docsUrl';
import sourceType from '../core/sourceType';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Module systems',
      description: 'Forbid potentially ambiguous parse goal (`script` vs. `module`).',
      url: docsUrl('unambiguous'),
    },
    schema: [],
  },

  create(context) {
    // ignore non-modules
    if (sourceType(context) !== 'module') {
      return {};
    }

    return {
      Program(ast) {
        if (!isModule(ast)) {
          context.report({
            node: ast,
            message: 'This module could be parsed as a valid script.',
          });
        }
      },
    };

  },
};
