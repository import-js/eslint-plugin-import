/**
 * Adds `.jsx`, `.ts` and `.tsx` as an extension, and enables JSX/TSX parsing.
 */

var allExtensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx'];

module.exports = {

  settings: {
    'import/extensions': allExtensions,
    'import/parsers': {
      '@typescript-eslint/parser': tsExtensions
    },
    'import/resolver': {
      'node': {
        'extensions': allExtensions
      }
    }
  }

}
