/**
 * Adds `.jsx`, `.ts` and `.tsx` as an extension, and enables JSX/TSX parsing.
 */

var allExtensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx']

module.exports = {

  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      ts: 'never',
      tsx: 'never',
      js: 'never',
      jsx: 'never',
    }],
  },

  settings: {
    'import/extensions': allExtensions,
    'import/external-module-folders': ['node_modules', 'node_modules/@types'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
    'import/resolver': {
      'node': {
        'extensions': allExtensions,
      },
    },
  },

}
