/**
 * @fileOverview Report modules that could parse incorrectly as scripts.
 * @author Ben Mosher
 */

import { isModule } from 'eslint-module-utils/unambiguous'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/unambiguous.md`,
    },
  },

  create: function (context) {
    // ignore non-modules
    if (context.parserOptions.sourceType !== 'module') {
      return {}
    }

    return {
      Program: function (ast) {
        if (!isModule(ast)) {
          context.report({
            node: ast,
            message: 'This module could be parsed as a valid script.',
          })
        }
      },
    }

  },
}
