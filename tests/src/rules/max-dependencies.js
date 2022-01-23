import { test, getTSParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/max-dependencies');

ruleTester.run('max-dependencies', rule, {
  valid: [
    test({ code: 'import "./foo.js"' }),

    test({ code: 'import "./foo.js"; import "./bar.js";',
      options: [{
        max: 2,
      }],
    }),

    test({ code: 'import "./foo.js"; import "./bar.js"; const a = require("./foo.js"); const b = require("./bar.js");',
      options: [{
        max: 2,
      }],
    }),

    test({ code: 'import {x, y, z} from "./foo"' }),
  ],
  invalid: [
    test({
      code: 'import { x } from \'./foo\'; import { y } from \'./foo\'; import {z} from \'./bar\';',
      options: [{
        max: 1,
      }],
      errors: [
        'Maximum number of dependencies (1) exceeded.',
      ],
    }),

    test({
      code: 'import { x } from \'./foo\'; import { y } from \'./bar\'; import { z } from \'./baz\';',
      options: [{
        max: 2,
      }],
      errors: [
        'Maximum number of dependencies (2) exceeded.',
      ],
    }),

    test({
      code: 'import { x } from \'./foo\'; require("./bar"); import { z } from \'./baz\';',
      options: [{
        max: 2,
      }],
      errors: [
        'Maximum number of dependencies (2) exceeded.',
      ],
    }),

    test({
      code: 'import { x } from \'./foo\'; import { z } from \'./foo\'; require("./bar"); const path = require("path");',
      options: [{
        max: 2,
      }],
      errors: [
        'Maximum number of dependencies (2) exceeded.',
      ],
    }),

    test({
      code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'',
      parser: parsers.BABEL_OLD,
      options: [{
        max: 1,
      }],
      errors: [
        'Maximum number of dependencies (1) exceeded.',
      ],
    }),

    test({
      code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'; import type { z } from \'./baz\'',
      parser: parsers.BABEL_OLD,
      options: [{
        max: 2,
        ignoreTypeImports: false,
      }],
      errors: [
        'Maximum number of dependencies (2) exceeded.',
      ],
    }),
  ],
});

describe('TypeScript', () => {
  getTSParsers()
    // Type-only imports were added in TypeScript ESTree 2.23.0
    .filter((parser) => parser !== parsers.TS_OLD)
    .forEach((parser) => {
      ruleTester.run(`max-dependencies (${parser.replace(process.cwd(), '.')})`, rule, {
        valid: [
          test({
            code: 'import type { x } from \'./foo\'; import { y } from \'./bar\';',
            parser,
            options: [{
              max: 1,
              ignoreTypeImports: true,
            }],
          }),
        ],
        invalid: [
          test({
            code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'',
            parser,
            options: [{
              max: 1,
            }],
            errors: [
              'Maximum number of dependencies (1) exceeded.',
            ],
          }),

          test({
            code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'; import type { z } from \'./baz\'',
            parser,
            options: [{
              max: 2,
              ignoreTypeImports: false,
            }],
            errors: [
              'Maximum number of dependencies (2) exceeded.',
            ],
          }),
        ],
      });
    });
});
