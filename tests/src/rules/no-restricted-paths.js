import { RuleTester } from 'eslint'
import rule from 'rules/no-restricted-paths'

import { test, testFilePath } from '../utils'

const ruleTester = new RuleTester()

ruleTester.run('no-restricted-paths', rule, {
  valid: [
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/server', from: './tests/files/restricted-paths/other' } ],
      } ],
    }),
    test({
      code: 'const a = require("../client/a.js")',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/server', from: './tests/files/restricted-paths/other' } ],
      } ],
    }),
    test({
      code: 'import b from "../server/b.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/other' } ],
      } ],
    }),
  ],

  invalid: [
    test({
      code: 'import b from "../server/b.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/server' } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import a from "../client/a"\nimport c from "./c"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [ {
        zones: [
          { target: './tests/files/restricted-paths/server', from: './tests/files/restricted-paths/client' },
          { target: './tests/files/restricted-paths/server', from: './tests/files/restricted-paths/server/c.js' },
        ],
      } ],
      errors: [
        {
          message: 'Unexpected path "../client/a" imported in restricted zone.',
          line: 1,
          column: 15,
        },
        {
          message: 'Unexpected path "./c" imported in restricted zone.',
          line: 2,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/b.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        zones: [ { target: './client', from: './server' } ],
        basePath: testFilePath('./restricted-paths'),
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'const b = require("../server/b.js")',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/server' } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 1,
        column: 19,
      } ],
    }),
  ],
})
