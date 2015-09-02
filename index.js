/**
 * eslint-plugin-modules - ESLint plugin for JavaScript modules 
 */

'use strict';

module.exports = {
  rules: {
      'no-cjs': require('./rules/no-cjs'),
      'no-exports-typo': require('./rules/no-exports-typo'),
      'no-define': require('./rules/no-define')
  },
  rulesConfig: {
      'no-cjs': 0,
      'no-define': 0
  }
};
