/**
 * eslint-plugin-modules - ESLint plugin for JavaScript modules 
 */

'use strict';

module.exports = {
  rules: {
      'no-cjs': require('./rules/no-cjs'),
      'no-exports-typo': require('./rules/no-exports-typo'),
      'no-define': require('./rules/no-define'),
      'no-mix-default-named': require('./rules/no-mix-default-named')
  },
  rulesConfig: {
      'no-cjs': 0,
      'no-define': 0,
      'no-mix-default-named': 0
  }
};
