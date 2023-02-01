const recommendedConfig = require('./recommended');

/**
 * The basics.
 * @type {Object}
 */
module.exports = {
  ...recommendedConfig,
  rules: {
    ...recommendedConfig.rules,
    'import/esm-extensions': 'error',
  },

  // need all these for parsing dependencies (even if _your_ code doesn't need
  // all of them)
  parserOptions: {
    ...recommendedConfig.parserOptions,
    ecmaVersion: 2020,
  },
};
