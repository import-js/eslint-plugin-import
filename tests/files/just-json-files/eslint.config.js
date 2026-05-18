var jsonPlugin = require('./fixture-json-plugin');

module.exports = [
  {
    files: ['tests/files/just-json-files/*.json'],
    plugins: {
      json: jsonPlugin,
    },
    processor: 'json/json',
    rules: Object.assign(
      {},
      {
        'import/no-unused-modules': [
          'error',
          {
            'missingExports': false,
            'unusedExports': true,
          },
        ],
      },
      jsonPlugin.configs.recommended.rules
    ),
  },
];
