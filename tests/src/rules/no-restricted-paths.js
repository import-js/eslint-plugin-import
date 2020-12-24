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
    test({
      code: 'import a from "./a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/one',
          from: './tests/files/restricted-paths/server',
          except: ['./one'],
        } ],
      } ],
    }),
    test({
      code: 'import a from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/one',
          from: './tests/files/restricted-paths/server',
          except: ['./two'],
        } ],
      } ],
    }),


    // irrelevant function calls
    test({ code: 'notrequire("../server/b.js")' }),
    test({
      code: 'notrequire("../server/b.js")',
      filename: testFilePath('./restricted-paths/client/a.js'),
        options: [ {
          zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/server' } ],
        } ] }),

    // no config
    test({ code: 'require("../server/b.js")' }),
    test({ code: 'import b from "../server/b.js"' }),

    // builtin (ignore)
    test({ code: 'require("os")' }),

    // type imports
    test({
      code: 'import type a from "../client/a.js"',
      parser: require.resolve('babel-eslint'),
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [ {
        allowedImportKinds: ['type'],
        zones: [ { target: './tests/files/restricted-paths/server', from: './tests/files/restricted-paths/client' } ],
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
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/one',
          from: './tests/files/restricted-paths/server',
          except: ['./one'],
        } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../two/a.js" imported in restricted zone.',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/one',
          from: './tests/files/restricted-paths/server',
          except: ['./one'],
          message: 'Custom message',
        } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../two/a.js" imported in restricted zone. Custom message',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/one',
          from: './tests/files/restricted-paths/server',
          except: ['../client/a'],
        } ],
      } ],
      errors: [ {
        message: 'Restricted path exceptions must be descendants of the configured ' +
          '`from` path for that zone.',
        line: 1,
        column: 15,
      } ],
    }),

    // type imports
    test({
      code: 'import type T from "../server/b.js";',
      parser: require.resolve('babel-eslint'),
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/server' } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 1,
        column: 20,
      } ],
    }),
    test({
      code: `
        import type { T } from "../server/b.js";
        import b from "../server/b.js";
      `,
      parser: require.resolve('babel-eslint'),
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        allowedImportKinds: ['type'],
        zones: [ { target: './tests/files/restricted-paths/client', from: './tests/files/restricted-paths/server' } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 3,
        column: 23,
      } ],
    }),
    test({
      code: `
        import type { T } from "../server/b.js";
        import b from "../server/b.js";
      `,
      parser: require.resolve('babel-eslint'),
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [ {
        allowedImportKinds: ['type'],
        zones: [ {
          target: './tests/files/restricted-paths/client',
          from: './tests/files/restricted-paths/server',
          allowedImportKinds: [],
        } ],
      } ],
      errors: [ {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 2,
        column: 32,
      }, {
        message: 'Unexpected path "../server/b.js" imported in restricted zone.',
        line: 3,
        column: 23,
      } ],
    }),
  ],
})
