var jsonPlugin = require('eslint-plugin-json');

if (!jsonPlugin.processors.json) {
  jsonPlugin.processors.json = jsonPlugin.processors['.json'];
}

module.exports = [
  {
    files: ['tests/files/just-json-files/*.json'],
    plugins:{
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
    )
  },
];
