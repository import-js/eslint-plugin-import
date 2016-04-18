import { RuleTester } from 'eslint'

const ERROR_MESSAGE = 'Expected empty line after import statement not followed by another import.';

const ruleTester = new RuleTester()

ruleTester.run('newline-after-import', require('rules/newline-after-import'), {
  valid: [
    {
      code: "import foo from 'foo';\n\nvar foo = 'bar';",
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "import foo from 'foo';\nimport { bar } from './bar-lib';",
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "import foo from 'foo';\n\nvar a = 123;\n\nimport { bar } from './bar-lib';",
      parserOptions: { sourceType: 'module' }
    },
  ],

  invalid: [
    {
      code: "import foo from 'foo';\nexport default function() {};",
      errors: [ {
        line: 2,
        column: 1,
        message: ERROR_MESSAGE
      } ],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "import foo from 'foo';\nvar a = 123;\n\nimport { bar } from './bar-lib';\nvar b=456;",
      errors: [
      {
        line: 2,
        column: 1,
        message: ERROR_MESSAGE
      },
      {
        line: 5,
        column: 1,
        message: ERROR_MESSAGE
      }],
      parserOptions: { sourceType: 'module' }
    },
  ]
});
