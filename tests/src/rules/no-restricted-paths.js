import { RuleTester } from 'eslint';
import rule from 'rules/no-restricted-paths';

import { test, testFilePath } from '../utils';

const ruleTester = new RuleTester();

ruleTester.run('no-restricted-paths', rule, {
  valid: [].concat(
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server',
              from: './tests/files/restricted-paths/other',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: '**/*',
              from: './tests/files/restricted-paths/other',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/client/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/!(client)/**/*',
              from: './tests/files/restricted-paths/client/**/*',
            },
          ],
        },
      ],
    }),
    test({
      code: 'const a = require("../client/a.js")',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server',
              from: './tests/files/restricted-paths/other',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import b from "../server/b.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: './tests/files/restricted-paths/other',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "./a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/one',
              from: './tests/files/restricted-paths/server',
              except: ['./one'],
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/one',
              from: './tests/files/restricted-paths/server',
              except: ['./two'],
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../one/a.js"',
      filename: testFilePath('./restricted-paths/server/two-new/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/two',
              from: './tests/files/restricted-paths/server',
              except: [],
            },
          ],
        },
      ],
    }),
    test({
      code: 'import A from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: '**/*',
              from: './tests/files/restricted-paths/server/**/*',
              except: ['**/a.js'],
            },
          ],
        },
      ],
    }),

    // support of arrays for from and target
    // array with single element
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/server'],
              from: './tests/files/restricted-paths/other',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server',
              from: ['./tests/files/restricted-paths/other'],
            },
          ],
        },
      ],
    }),
    // array with multiple elements
    test({
      code: 'import a from "../one/a.js"',
      filename: testFilePath('./restricted-paths/server/two-new/a.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/server/two', './tests/files/restricted-paths/server/three'],
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
    }),
    test({
      code: 'import a from "../one/a.js"',
      filename: testFilePath('./restricted-paths/server/two-new/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server',
              from: ['./tests/files/restricted-paths/server/two', './tests/files/restricted-paths/server/three'],
              except: [],
            },
          ],
        },
      ],
    }),
    // array with multiple glob patterns in from
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/client/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/!(client)/**/*',
              from: ['./tests/files/restricted-paths/client/*', './tests/files/restricted-paths/client/one/*'],
            },
          ],
        },
      ],
    }),
    // array with mix of glob and non glob patterns in target
    test({
      code: 'import a from "../client/a.js"',
      filename: testFilePath('./restricted-paths/client/b.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/!(client)/**/*', './tests/files/restricted-paths/client/a/'],
              from: './tests/files/restricted-paths/client/**/*',
            },
          ],
        },
      ],
    }),

    // irrelevant function calls
    test({ code: 'notrequire("../server/b.js")' }),
    test({
      code: 'notrequire("../server/b.js")',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
    }),

    // no config
    test({ code: 'require("../server/b.js")' }),
    test({ code: 'import b from "../server/b.js"' }),

    // builtin (ignore)
    test({ code: 'require("os")' }),
  ),

  invalid: [].concat(
    test({
      code: 'import b from "../server/b.js"; // 1',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/b.js"; // 2',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client/**/*',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    // TODO: fix test on windows
    process.platform === 'win32' ? [] : test({
      code: 'import b from "../server/b.js";',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client/*.js',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/b.js"; // 2 ter',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client/**',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import a from "../client/a"\nimport c from "./c"',
      filename: testFilePath('./restricted-paths/server/b.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server',
              from: './tests/files/restricted-paths/client',
            },
            {
              target: './tests/files/restricted-paths/server',
              from: './tests/files/restricted-paths/server/c.js',
            },
          ],
        },
      ],
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
      code: 'import b from "../server/b.js"; // 3',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './client',
              from: './server',
            },
          ],
          basePath: testFilePath('./restricted-paths'),
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'const b = require("../server/b.js")',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 19,
        },
      ],
    }),
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/one',
              from: './tests/files/restricted-paths/server',
              except: ['./one'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../two/a.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/one',
              from: './tests/files/restricted-paths/server',
              except: ['./one'],
              message: 'Custom message',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../two/a.js" imported in restricted zone. Custom message',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/server/one',
              from: './tests/files/restricted-paths/server',
              except: ['../client/a'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Restricted path exceptions must be descendants of the configured ' +
          '`from` path for that zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import A from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: '**/*',
              from: './tests/files/restricted-paths/server/**/*',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../two/a.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import A from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: '**/*',
              from: './tests/files/restricted-paths/server/**/*',
              except: ['a.js'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Restricted path exceptions must be glob patterns when `from` contains glob patterns',
          line: 1,
          column: 15,
        },
      ],
    }),

    // support of arrays for from and target
    // array with single element
    test({
      code: 'import b from "../server/b.js"; // 4',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/client'],
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/b.js"; // 5',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: ['./tests/files/restricted-paths/server'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    // array with multiple elements
    test({
      code: 'import b from "../server/b.js"; // 6',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/client/one', './tests/files/restricted-paths/client'],
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/one/b.js"\nimport a from "../server/two/a.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: ['./tests/files/restricted-paths/server/one', './tests/files/restricted-paths/server/two'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/one/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
        {
          message: 'Unexpected path "../server/two/a.js" imported in restricted zone.',
          line: 2,
          column: 15,
        },
      ],
    }),
    // array with multiple glob patterns in from
    test({
      code: 'import b from "../server/one/b.js"\nimport a from "../server/two/a.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: ['./tests/files/restricted-paths/server/one/*', './tests/files/restricted-paths/server/two/*'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/one/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
        {
          message: 'Unexpected path "../server/two/a.js" imported in restricted zone.',
          line: 2,
          column: 15,
        },
      ],
    }),
    // array with mix of glob and non glob patterns in target
    test({
      code: 'import b from "../server/b.js"; // 7',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: ['./tests/files/restricted-paths/client/one', './tests/files/restricted-paths/client/**/*'],
              from: './tests/files/restricted-paths/server',
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Unexpected path "../server/b.js" imported in restricted zone.',
          line: 1,
          column: 15,
        },
      ],
    }),
    // configuration format
    test({
      code: 'import A from "../two/a.js"',
      filename: testFilePath('./restricted-paths/server/one/a.js'),
      options: [
        {
          zones: [
            {
              target: '**/*',
              from: ['./tests/files/restricted-paths/server/**/*'],
              except: ['a.js'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Restricted path exceptions must be glob patterns when `from` contains glob patterns',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "../server/one/b.js"',
      filename: testFilePath('./restricted-paths/client/a.js'),
      options: [
        {
          zones: [
            {
              target: './tests/files/restricted-paths/client',
              from: ['./tests/files/restricted-paths/server/one', './tests/files/restricted-paths/server/two/*'],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Restricted path `from` must contain either only glob patterns or none',
          line: 1,
          column: 15,
        },
      ],
    }),
  ),
});
