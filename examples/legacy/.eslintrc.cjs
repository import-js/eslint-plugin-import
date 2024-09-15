module.exports = {
  root: true,
  env: { es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/react',
    'plugin:import/typescript',
  ],
  settings: {},
  ignorePatterns: ['.eslintrc.cjs', '**/exports-unused.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import'],
  rules: {
    'no-unused-vars': 'off',
    'import/no-dynamic-require': 'warn',
    'import/no-nodejs-modules': 'warn',
    'import/no-unused-modules': ['warn', { unusedExports: true }],
    'import/no-cycle': 'warn',
  },
};
