import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/max-dependencies')

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

    test({ code: 'import {x, y, z} from "./foo"'}),
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
      parser: 'babel-eslint',
      options: [{
        max: 1,
      }],
      errors: [
        'Maximum number of dependencies (1) exceeded.',
      ],
    }),
  ],
})
