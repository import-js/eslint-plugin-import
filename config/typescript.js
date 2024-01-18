/**
 * This config:
 * 1) adds `.jsx`, `.ts`, `.cts`, `.mts`, and `.tsx` as an extension
 * 2) enables JSX/TSX parsing
 */

// Omit `.d.ts` because 1) TypeScript compilation already confirms that
// types are resolved, and 2) it would mask an unresolved
// `.ts`/`.tsx`/`.js`/`.jsx` implementation.
const typeScriptExtensions = ['.ts', '.cts', '.mts', '.tsx']

const allExtensions = [...typeScriptExtensions, '.js', '.jsx']

module.exports = {
  settings: {
    'i/extensions': allExtensions,
    'i/external-module-folders': ['node_modules', 'node_modules/@types'],
    'i/parsers': {
      '@typescript-eslint/parser': typeScriptExtensions,
    },
    'i/resolver': {
      node: {
        extensions: allExtensions,
      },
    },
  },

  rules: {
    // analysis/correctness

    // TypeScript compilation already ensures that named imports exist in the referenced module
    'i/named': 'off',
  },
}
