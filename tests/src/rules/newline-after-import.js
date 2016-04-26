import { RuleTester } from 'eslint'

const IMPORT_ERROR_MESSAGE = 'Expected empty line after import statement not followed by another import.';
const REQUIRE_ERROR_MESSAGE = 'Expected empty line after require statement not followed by another require.';

const ruleTester = new RuleTester()

ruleTester.run('newline-after-import', require('rules/newline-after-import'), {
  valid: [
    {
      code: "import foo from 'foo';\n\nvar foo = 'bar';",
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\n\nvar foo = 'bar';",
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "require('foo-module');\n\nvar foo = 'bar';",
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
    {
      code: "var foo = require('foo-module');\n\nvar a = 123;\n\nvar bar = require('bar-lib');",
      parserOptions: { sourceType: 'module' }
    }
  ],

  invalid: [
    {
      code: "import foo from 'foo';\nexport default function() {};",
      errors: [ {
        line: 2,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      } ],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar something = 123;",
      errors: [ {
        line: 2,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE
      } ],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "import foo from 'foo';\nvar a = 123;\n\nimport { bar } from './bar-lib';\nvar b=456;",
      errors: [
      {
        line: 2,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      },
      {
        line: 5,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      }],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar a = 123;\n\nvar bar = require('bar-lib');\nvar b=456;",
      errors: [
        {
          line: 2,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        },
        {
          line: 5,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        }],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar a = 123;\n\nrequire('bar-lib');\nvar b=456;",
      errors: [
        {
          line: 2,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        },
        {
          line: 5,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        }],
      parserOptions: { sourceType: 'module' }
    },
  ]
});
