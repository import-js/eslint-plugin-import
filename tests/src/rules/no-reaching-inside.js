import { RuleTester } from 'eslint'
import rule from 'rules/no-reaching-inside'

import { test, testFilePath } from '../utils'

const ruleTester = new RuleTester()

ruleTester.run('no-reaching-inside', rule, {
  valid: [
    test({
      code: 'import a from "./plugin2"',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
      options: [],
    }),
    test({
      code: 'const a = require("./plugin2")',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
    }),
    test({
      code: 'const a = require("./plugin2/")',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
    }),
    test({
      code: 'const dynamic = "./plugin2/"; const a = require(dynamic)',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
    }),
    test({
      code: 'import b from "./internal.js"',
      filename: testFilePath('./reaching-inside/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import get from "lodash.get"',
      filename: testFilePath('./reaching-inside/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import b from "../../api/service"',
      filename: testFilePath('./reaching-inside/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ '**/api' ],
      } ],
    }),
    test({
      code: 'import "jquery/dist/jquery"',
      filename: testFilePath('./reaching-inside/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ 'jquery/**' ],
      } ],
    }),
    test({
      code: 'import "/app/index.js"',
      filename: testFilePath('./reaching-inside/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ '/app' ],
      } ],
    }),
  ],

  invalid: [
    test({
      code: 'import b from "./plugin2/internal"',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
      errors: [ {
        message: 'Reaching into "plugin2" is not allowed.',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import a from "../api/service/index"',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
      options: [ {
        allow: [ '**/reaching-inside/*' ],
      } ],
      errors: [
        {
          message: 'Reaching into "../api/service" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import get from "lodash/get"',
      filename: testFilePath('./reaching-inside/plugins/plugin.js'),
      errors: [
        {
          message: 'Reaching into "lodash" is not allowed.',
          line: 1,
          column: 17,
        },
      ],
    }),
  ],
})
