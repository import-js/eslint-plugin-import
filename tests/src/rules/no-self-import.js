import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-self-import')

ruleTester.run('no-self-import', rule, {
  valid: [
    test({ filename: 'foo', code: 'import "./bar"' }),
    test({ filename: 'foo', code: 'import "./bar.js"' }),
    test({ filename: 'foo.js', code: 'import "./bar"' }),
    test({ filename: 'foo.js', code: 'import "./bar.js"' }),
    test({ filename: 'foo.jsx', code: 'import "./bar"' }),
    test({ filename: 'foo.jsx', code: 'import "./bar.jsx"' }),
    test({ filename: 'foo.jsx', code: 'import "./foo.js"' }),

    // es7
    test({ filename: 'foo.js', code: 'export bar, { foo } from "./bar";', parser: 'babel-eslint' }),
    test({ filename: 'foo.js', code: 'export bar from "./bar";', parser: 'babel-eslint' }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    test({
      code: 'import "./foo";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),

    test({
      code: 'import "./foo.jsx";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),

    test({
      code: 'import foo from "./foo";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),

    test({
      code: 'import foo from "./foo.jsx";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),

    test({
      code: 'import { foo } from "./foo";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),

    test({
      code: 'import { foo } from "./foo.jsx";',
      filename: 'foo.jsx',
      errors: [
        { message: 'Importing from the current file.', type: 'ImportDeclaration' },
      ]
    }),
  ],
})
