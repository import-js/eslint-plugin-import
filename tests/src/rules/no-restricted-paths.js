import { RuleTester } from 'eslint';
import rule from 'rules/no-restricted-paths';

import { test, testFilePath } from '../utils';

const ruleTester = new RuleTester();

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
    test({
      code: 'import a from "../one/a.js"',
      filename: testFilePath('./restricted-paths/server/two-new/a.js'),
      options: [ {
        zones: [ {
          target: './tests/files/restricted-paths/server/two',
          from: './tests/files/restricted-paths/server',
          except: [],
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
  ],
});
