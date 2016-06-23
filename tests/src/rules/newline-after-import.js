import { RuleTester } from 'eslint'

const IMPORT_ERROR_MESSAGE = 'Expected empty line after import statement not followed by another import.';
const REQUIRE_ERROR_MESSAGE = 'Expected empty line after require statement not followed by another require.';

const ruleTester = new RuleTester()

ruleTester.run('newline-after-import', require('rules/newline-after-import'), {
  valid: [
    "var path = require('path');\nvar foo = require('foo');\n",
    "a(require('b'), require('c'), require('d'));",
    `function foo() {
      switch (renderData.modalViewKey) {
        case 'value':
          var bar = require('bar');
          return bar(renderData, options)
        default:
          return renderData.mainModalContent.clone()
      }
    }`,
    {
      code: "import path from 'path';\nimport foo from 'foo';\n",
      parserOptions: { sourceType: 'module' },
    },
    {
      code: "import path from 'path';import foo from 'foo';\n",
      parserOptions: { sourceType: 'module' },
    },
    {
      code: "import path from 'path';import foo from 'foo';\n\nvar bar = 42;",
      parserOptions: { sourceType: 'module' },
    },
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
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      } ],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar something = 123;",
      errors: [ {
        line: 1,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE
      } ],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "import foo from 'foo';\nvar a = 123;\n\nimport { bar } from './bar-lib';\nvar b=456;",
      errors: [
      {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      },
      {
        line: 4,
        column: 1,
        message: IMPORT_ERROR_MESSAGE
      }],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar a = 123;\n\nvar bar = require('bar-lib');\nvar b=456;",
      errors: [
        {
          line: 1,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        },
        {
          line: 4,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        }],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var foo = require('foo-module');\nvar a = 123;\n\nrequire('bar-lib');\nvar b=456;",
      errors: [
        {
          line: 1,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        },
        {
          line: 4,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        }],
      parserOptions: { sourceType: 'module' }
    },
    {
      code: "var path = require('path');\nvar foo = require('foo');\nvar bar = 42;",
      errors: [ {
        line: 2,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ]
    },
    {
      code: "var assign = Object.assign || require('object-assign');\nvar foo = require('foo');\nvar bar = 42;",
      errors: [ {
        line: 2,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ]
    },
    {
      code: "function a() {\nvar assign = Object.assign || require('object-assign');\nvar foo = require('foo');\nvar bar = 42; }",
      errors: [ {
        line: 3,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ]
    },
    {
      code: "require('a');\nfoo(require('b'), require('c'), require('d'));\nrequire('d');\nvar foo = 'bar';",
      errors: [
        {
          line: 3,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        },
      ]
    },
    {
      code: "require('a');\nfoo(\nrequire('b'),\nrequire('c'),\nrequire('d')\n);\nvar foo = 'bar';",
      errors: [
        {
          line: 6,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE
        }
      ]
    },
    {
      code: "import path from 'path';\nimport foo from 'foo';\nvar bar = 42;",
      errors: [ {
        line: 2,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: "import path from 'path';import foo from 'foo';var bar = 42;",
      errors: [ {
        line: 1,
        column: 25,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
  ]
})
