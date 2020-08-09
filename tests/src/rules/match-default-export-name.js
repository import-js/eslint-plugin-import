import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/match-default-export-name')

ruleTester.run('match-default-export-name', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import myConstant from "./match-default-export-name/id";' }),
    test({ code: 'import myFunction from "./match-default-export-name/fn";' }),
    test({ code: 'import MyClass from "./match-default-export-name/class";' }),
    test({ code: 'import anyNameValue from "./match-default-export-name/expression";' }),

    // es7
    test({
      code: 'export myConstant from "./match-default-export-name/id";',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export myFunction from "./match-default-export-name/fn";',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export MyClass from "./match-default-export-name/class";',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export anyNameValue from "./match-default-export-name/expression";',
      parser: require.resolve('babel-eslint'),
    }),

    // overrides
    test({
      code: 'import React from "react";',
      options: [
        {
          overrides: [
            {
              module: 'react',
              name: 'React',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import styles from "./match-default-export-name/styles.css";',
      options: [
        {
          overrides: [
            {
              module: '/[^\\w]styles\\.css$/',
              name: 'styles',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import componentStyles from "./match-default-export-name/component.module.css";',
      options: [
        {
          overrides: [
            {
              module: '/(\\w+)\\.module\\.css$/',
              name: '$1Styles',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import id from "./match-default-export-name/id";',
      options: [
        {
          overrides: [
            {
              module: '/(\\w+)$/',
              name: '$1',
            },
          ],
        },
      ],
    }),

    // #566: don't false-positive on `default` itself
    test({
      code: 'export default from "./bar";',
      parser: require.resolve('babel-eslint'),
    }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    test({
      code: 'import foo from "./malformed.js"',
      errors: [{
        message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
        type: 'Literal',
      }],
    }),


    test({
      code: 'import someConstant from "./match-default-export-name/id";',
      output: 'import myConstant from "./match-default-export-name/id";',
      errors: [{
        message: 'Expected import \'someConstant\' to match the default export \'myConstant\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import myFnction from "./match-default-export-name/fn";',
      output: 'import myFunction from "./match-default-export-name/fn";',
      errors: [{
        message: 'Expected import \'myFnction\' to match the default export \'myFunction\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import myClass from "./match-default-export-name/class";',
      output: 'import MyClass from "./match-default-export-name/class";',
      errors: [{
        message: 'Expected import \'myClass\' to match the default export \'MyClass\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),

    // es7
    test({
      code: 'export someConstant from "./match-default-export-name/id";',
      output: 'export myConstant from "./match-default-export-name/id";',
      parser: require.resolve('babel-eslint'),
      errors: [{
        message: 'Expected export \'someConstant\' to match the default export \'myConstant\'.',
        type: 'ExportDefaultSpecifier',
      }],
    }),
    test({
      code: 'export myFnction from "./match-default-export-name/fn";',
      output: 'export myFunction from "./match-default-export-name/fn";',
      parser: require.resolve('babel-eslint'),
      errors: [{
        message: 'Expected export \'myFnction\' to match the default export \'myFunction\'.',
        type: 'ExportDefaultSpecifier',
      }],
    }),
    test({
      code: 'export myClass from "./match-default-export-name/class";',
      output: 'export MyClass from "./match-default-export-name/class";',
      parser: require.resolve('babel-eslint'),
      errors: [{
        message: 'Expected export \'myClass\' to match the default export \'MyClass\'.',
        type: 'ExportDefaultSpecifier',
      }],
    }),

    // overrides
    test({
      code: 'import react from "react";',
      output: 'import React from "react";',
      options: [
        {
          overrides: [
            {
              module: 'react',
              name: 'React',
            },
          ],
        },
      ],
      errors: [{
        message: 'Expected import \'react\' to match \'React\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import css from "./match-default-export-name/styles.css";',
      output: 'import styles from "./match-default-export-name/styles.css";',
      options: [
        {
          overrides: [
            {
              module: '/[^\\w]styles\\.css$/',
              name: 'styles',
            },
          ],
        },
      ],
      errors: [{
        message: 'Expected import \'css\' to match \'styles\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import css from "./match-default-export-name/component.module.css";',
      output: 'import componentStyles from "./match-default-export-name/component.module.css";',
      options: [
        {
          overrides: [
            {
              module: '/(\\w+)\\.module\\.css$/',
              name: '$1Styles',
            },
          ],
        },
      ],
      errors: [{
        message: 'Expected import \'css\' to match \'componentStyles\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import myConstant from "./match-default-export-name/id";',
      output: 'import id from "./match-default-export-name/id";',
      options: [
        {
          overrides: [
            {
              module: '/(\\w+)$/',
              name: '$1',
            },
          ],
        },
      ],
      errors: [{
        message: 'Expected import \'myConstant\' to match \'id\'.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
  ],
})
