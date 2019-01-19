import { RuleTester } from 'eslint'

const IMPORT_ERROR_MESSAGE = 'Expected 1 empty line after import statement not followed by another import.'
const IMPORT_ERROR_MESSAGE_MULTIPLE = (count) => {
    return `Expected ${count} empty lines after import statement not followed by another import.`
}
const REQUIRE_ERROR_MESSAGE = 'Expected 1 empty line after require statement not followed by another require.'

const ruleTester = new RuleTester()

ruleTester.run('newline-after-import', require('rules/newline-after-import'), {
  valid: [
    `var path = require('path');\nvar foo = require('foo');\n`,
    `require('foo');`,
    `switch ('foo') { case 'bar': require('baz'); }`,
    {
      code: `
        const x = () => require('baz')
            , y = () => require('bar')`,
      parserOptions: { ecmaVersion: 6 } ,
    },
    {
      code: `const x = () => require('baz') && require('bar')`,
      parserOptions: { ecmaVersion: 6 } ,
    },
    `function x(){ require('baz'); }`,
    `a(require('b'), require('c'), require('d'));`,
    `function foo() {
      switch (renderData.modalViewKey) {
        case 'value':
          var bar = require('bar');
          return bar(renderData, options)
        default:
          return renderData.mainModalContent.clone()
      }
    }`,
    { code: `//issue 441
    function bar() {
      switch (foo) {
        case '1':
          return require('../path/to/file1.jst.hbs')(renderData, options);
        case '2':
          return require('../path/to/file2.jst.hbs')(renderData, options);
        case '3':
          return require('../path/to/file3.jst.hbs')(renderData, options);
        case '4':
          return require('../path/to/file4.jst.hbs')(renderData, options);
        case '5':
          return require('../path/to/file5.jst.hbs')(renderData, options);
        case '6':
          return require('../path/to/file6.jst.hbs')(renderData, options);
        case '7':
          return require('../path/to/file7.jst.hbs')(renderData, options);
        case '8':
          return require('../path/to/file8.jst.hbs')(renderData, options);
        case '9':
          return require('../path/to/file9.jst.hbs')(renderData, options);
        case '10':
          return require('../path/to/file10.jst.hbs')(renderData, options);
        case '11':
          return require('../path/to/file11.jst.hbs')(renderData, options);
        case '12':
          return something();
        default:
          return somethingElse();
      }
    }`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import path from 'path';\nimport foo from 'foo';\n`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import path from 'path';import foo from 'foo';\n`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import path from 'path';import foo from 'foo';\n\nvar bar = 42;`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\n\nvar bar = 'bar';`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\n\n\nvar bar = 'bar';`,
      parserOptions: { sourceType: 'module' },
      options: [{ 'count': 2 }],
    },
    {
      code: `import foo from 'foo';\n\n\n\n\nvar bar = 'bar';`,
      parserOptions: { sourceType: 'module' },
      options: [{ 'count': 4 }],
    },
    {
      code: `var foo = require('foo-module');\n\nvar foo = 'bar';`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\n\n\nvar foo = 'bar';`,
      parserOptions: { sourceType: 'module' },
      options: [{ 'count': 2 }],
    },
    {
      code: `var foo = require('foo-module');\n\n\n\n\nvar foo = 'bar';`,
      parserOptions: { sourceType: 'module' },
      options: [{ 'count': 4 }],
    },
    {
      code: `require('foo-module');\n\nvar foo = 'bar';`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\nimport { bar } from './bar-lib';`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\n\nvar a = 123;\n\nimport { bar } from './bar-lib';`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\n\nvar a = 123;\n\nvar bar = require('bar-lib');`,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `
        function foo() {
          var foo = require('foo');
          foo();
        }
      `,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `
        if (true) {
          var foo = require('foo');
          foo();
        }
      `,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `
        function a() {
          var assign = Object.assign || require('object-assign');
          var foo = require('foo');
          var bar = 42;
        }
      `,
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `//issue 592
        export default
        @SomeDecorator(require('./some-file'))
        class App {}
      `,
      parserOptions: { sourceType: 'module' },
      parser: 'babel-eslint',
    },
    {
      code: `var foo = require('foo');\n\n@SomeDecorator(foo)\nclass Foo {}`,
      parserOptions: { sourceType: 'module' },
      parser: 'babel-eslint',
    },
  ],

  invalid: [
    {
      code: `import foo from 'foo';\nexport default function() {};`,
      output: `import foo from 'foo';\n\nexport default function() {};`,
      errors: [ {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\n\nexport default function() {};`,
      output: `import foo from 'foo';\n\n\nexport default function() {};`,
      options: [{ 'count': 2 }],
      errors: [ {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE_MULTIPLE(2),
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\nvar something = 123;`,
      output: `var foo = require('foo-module');\n\nvar something = 123;`,
      errors: [ {
        line: 1,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\nexport default function() {};`,
      output: `import foo from 'foo';\n\nexport default function() {};`,
      options: [{ 'count': 1 }],
      errors: [ {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\nvar something = 123;`,
      output: `var foo = require('foo-module');\n\nvar something = 123;`,
      errors: [ {
        line: 1,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\nvar a = 123;\n\nimport { bar } from './bar-lib';\nvar b=456;`,
      output: `import foo from 'foo';\n\nvar a = 123;\n\nimport { bar } from './bar-lib';\n\nvar b=456;`,
      errors: [
      {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      },
      {
        line: 4,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      }],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\nvar a = 123;\n\nvar bar = require('bar-lib');\nvar b=456;`,
      output: `var foo = require('foo-module');\n\nvar a = 123;\n\nvar bar = require('bar-lib');\n\nvar b=456;`,
      errors: [
        {
          line: 1,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        },
        {
          line: 4,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        }],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var foo = require('foo-module');\nvar a = 123;\n\nrequire('bar-lib');\nvar b=456;`,
      output: `var foo = require('foo-module');\n\nvar a = 123;\n\nrequire('bar-lib');\n\nvar b=456;`,
      errors: [
        {
          line: 1,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        },
        {
          line: 4,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        }],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `var path = require('path');\nvar foo = require('foo');\nvar bar = 42;`,
      output: `var path = require('path');\nvar foo = require('foo');\n\nvar bar = 42;`,
      errors: [ {
        line: 2,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ],
    },
    {
      code: `var assign = Object.assign || require('object-assign');\nvar foo = require('foo');\nvar bar = 42;`,
      output: `var assign = Object.assign || require('object-assign');\nvar foo = require('foo');\n\nvar bar = 42;`,
      errors: [ {
        line: 2,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ],
    },
    {
      code: `require('a');\nfoo(require('b'), require('c'), require('d'));\nrequire('d');\nvar foo = 'bar';`,
      output: `require('a');\nfoo(require('b'), require('c'), require('d'));\nrequire('d');\n\nvar foo = 'bar';`,
      errors: [
        {
          line: 3,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        },
      ],
    },
    {
      code: `require('a');\nfoo(\nrequire('b'),\nrequire('c'),\nrequire('d')\n);\nvar foo = 'bar';`,
      output: `require('a');\nfoo(\nrequire('b'),\nrequire('c'),\nrequire('d')\n);\n\nvar foo = 'bar';`,
      errors: [
        {
          line: 6,
          column: 1,
          message: REQUIRE_ERROR_MESSAGE,
        },
      ],
    },
    {
      code: `import path from 'path';\nimport foo from 'foo';\nvar bar = 42;`,
      output: `import path from 'path';\nimport foo from 'foo';\n\nvar bar = 42;`,
      errors: [ {
        line: 2,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import path from 'path';import foo from 'foo';var bar = 42;`,
      output: `import path from 'path';import foo from 'foo';\n\nvar bar = 42;`,
      errors: [ {
        line: 1,
        column: 25,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
    },
    {
      code: `import foo from 'foo';\n@SomeDecorator(foo)\nclass Foo {}`,
      output: `import foo from 'foo';\n\n@SomeDecorator(foo)\nclass Foo {}`,
      errors: [ {
        line: 1,
        column: 1,
        message: IMPORT_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
      parser: 'babel-eslint',
    },
    {
      code: `var foo = require('foo');\n@SomeDecorator(foo)\nclass Foo {}`,
      output: `var foo = require('foo');\n\n@SomeDecorator(foo)\nclass Foo {}`,
      errors: [ {
        line: 1,
        column: 1,
        message: REQUIRE_ERROR_MESSAGE,
      } ],
      parserOptions: { sourceType: 'module' },
      parser: 'babel-eslint',
    },
  ],
})
