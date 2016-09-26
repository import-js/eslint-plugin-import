import { RuleTester } from 'eslint'
import rule from 'rules/no-internal-modules'

import { test, testFilePath } from '../utils'

const ruleTester = new RuleTester()

ruleTester.run('no-internal-modules', rule, {
  valid: [
    test({
      code: 'import a from "./plugin2"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [],
    }),
    test({
      code: 'const a = require("./plugin2")',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'const a = require("./plugin2/")',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'const dynamic = "./plugin2/"; const a = require(dynamic)',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'import b from "./internal.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import get from "lodash.get"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import b from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
    }),
    test({
      code: 'import b from "../../api/service"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ '**/api/*' ],
      } ],
    }),
    test({
      code: 'import "jquery/dist/jquery"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ 'jquery/dist/*' ],
      } ],
    }),
    test({
      code: 'import "./app/index.js";\nimport "./app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [ {
        allow: [ '**/index{.js,}' ],
      } ],
    }),
  ],

  invalid: [
    test({
      code: 'import "./plugin2/index.js";\nimport "./plugin2/app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [ {
        allow: [ '*/index.js' ],
      } ],
      errors: [ {
        message: 'Reaching to "./plugin2/app/index" is not allowed.',
        line: 2,
        column: 8,
      } ],
    }),
    test({
      code: 'import "./app/index.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [ {
        message: 'Reaching to "./app/index.js" is not allowed.',
        line: 1,
        column: 8,
      } ],
    }),
    test({
      code: 'import b from "./plugin2/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [ {
        message: 'Reaching to "./plugin2/internal" is not allowed.',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import a from "../api/service/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [ {
        allow: [ '**/internal-modules/*' ],
      } ],
      errors: [
        {
          message: 'Reaching to "../api/service/index" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "@org/package/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [
        {
          message: 'Reaching to "@org/package/internal" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import get from "debug/node"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [
        {
          message: 'Reaching to "debug/node" is not allowed.',
          line: 1,
          column: 17,
        },
      ],
    }),
  ],
})
