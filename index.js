/**
 * eslint-plugin-modules - ESLint plugin for JavaScript modules 
 */

'use strict';

module.exports = {
  rules: {
      'no-cjs': require('./rules/no-cjs'),
      'no-define': require('./rules/no-define')
  },
  rulesConfig: {
      'no-cjs': 0,
      'no-define': 0
  }
};
