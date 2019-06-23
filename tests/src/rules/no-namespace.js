import { RuleTester } from 'eslint'

const ERROR_MESSAGE = 'Unexpected namespace import.'

const ruleTester = new RuleTester()

ruleTester.run('no-namespace', require('rules/no-namespace'), {
  valid: [
    { code: "import { a, b } from 'foo';", parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: "import { a, b } from './foo';", parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: "import bar from 'bar';", parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: "import bar from './bar';", parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
  ],

  invalid: [
    {
      code: "import * as foo from 'foo';",
      errors: [ {
        line: 1,
        column: 8,
        message: ERROR_MESSAGE,
      } ],
      parserOptions: { ecmaVersion: 2015, sourceType: 'module' },
    },
    {
      code: "import defaultExport, * as foo from 'foo';",
      errors: [ {
        line: 1,
        column: 23,
        message: ERROR_MESSAGE,
      } ],
      parserOptions: { ecmaVersion: 2015, sourceType: 'module' },
    },
    {
      code: "import * as foo from './foo';",
      errors: [ {
        line: 1,
        column: 8,
        message: ERROR_MESSAGE,
      } ],
      parserOptions: { ecmaVersion: 2015, sourceType: 'module' },
    },
  ],
})
