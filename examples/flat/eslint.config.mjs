import importPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.react,
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ignores: ['eslint.config.mjs', '**/exports-unused.ts'],
    rules: {
      'no-unused-vars': 'off',
      'import/no-dynamic-require': 'warn',
      'import/no-nodejs-modules': 'warn',
      'import/no-unused-modules': ['warn', { unusedExports: true }],
      'import/no-cycle': 'warn',
    },
  },
];
