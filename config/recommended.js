/**
 * The basics.
 * @type {Object}
 */
module.exports = {
  plugins: ['i'],

  rules: {
    // analysis/correctness
    'i/no-unresolved': 'error',
    'i/named': 'error',
    'i/namespace': 'error',
    'i/default': 'error',
    'i/export': 'error',

    // red flags (thus, warnings)
    'i/no-named-as-default': 'warn',
    'i/no-named-as-default-member': 'warn',
    'i/no-duplicates': 'warn',
  },

  // need all these for parsing dependencies (even if _your_ code doesn't need
  // all of them)
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2018,
  },
}
