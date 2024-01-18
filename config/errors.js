/**
 * unopinionated config. just the things that are necessarily runtime errors
 * waiting to happen.
 * @type {Object}
 */
module.exports = {
  plugins: ['import'],
  rules: {
    'i/no-unresolved': 2,
    'i/named': 2,
    'i/namespace': 2,
    'i/default': 2,
    'i/export': 2,
  },
}
