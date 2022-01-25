import { test, parsers, getNonDefaultParsers, getBabelParserConfig, babelSyntaxPlugins } from '../utils';

import { RuleTester } from 'eslint';
import flatMap from 'array.prototype.flatmap';

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
  ],
});

describe('Non Default Parsers', () => {
  flatMap(
    getNonDefaultParsers()
      // Type-only imports were added in TypeScript ESTree 2.23.0
      .filter((parser) => parser !== parsers.TS_OLD),
    (parser) => {
      const configs = [];
      if (parser === parsers.BABEL_NEW) {
        configs.push(
          getBabelParserConfig(parser, { plugins: [babelSyntaxPlugins.typescript] }),
          getBabelParserConfig(parser, { plugins: [babelSyntaxPlugins.flow] }),
        );
      } else {
        configs.push({ parser });
      }
      return configs;
    }).forEach((parserConfig) => {
    ruleTester.run('max-dependencies', rule, {
      valid: [
        test({
          code: 'import type { x } from \'./foo\'; import { y } from \'./bar\';',
          options: [{
            max: 1,
            ignoreTypeImports: true,
          }],
          ...parserConfig,
        }),
      ],
      invalid: [
        test({
          code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'',
          options: [{
            max: 1,
          }],
          errors: [
            'Maximum number of dependencies (1) exceeded.',
          ],
          ...parserConfig,
        }),
        test({
          code: 'import type { x } from \'./foo\'; import type { y } from \'./bar\'; import type { z } from \'./baz\'',
          options: [{
            max: 2,
            ignoreTypeImports: false,
          }],
          errors: [
            'Maximum number of dependencies (2) exceeded.',
          ],
          ...parserConfig,
        }),
      ],
    });
  });
});
