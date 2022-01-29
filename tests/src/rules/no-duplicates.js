import * as path from 'path';
import { test as testUtil, getNonDefaultParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

const ruleTester = new RuleTester();
const rule = require('rules/no-duplicates');

// autofix only possible with eslint 4+
const test = semver.satisfies(eslintPkg.version, '< 4')
  ? t => testUtil(Object.assign({}, t, { output: t.code }))
  : testUtil;

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: "import { x } from './foo'; import { y } from './bar'" }),

    // #86: every unresolved module should not show up as 'null' and duplicate
    test({ code: 'import foo from "234artaf";' +
                 'import { shoop } from "234q25ad"' }),

    // #225: ignore duplicate if is a flow type import
    test({
      code: "import { x } from './foo'; import type { y } from './foo'",
      parser: parsers.BABEL_OLD,
    }),

    // #1107: Using different query strings that trigger different webpack loaders.
    test({
      code: "import x from './bar?optionX'; import y from './bar?optionY';",
      options: [{ 'considerQueryString': true }],
      settings: { 'import/resolver': 'webpack' },
    }),
    test({
      code: "import x from './foo'; import y from './bar';",
      options: [{ 'considerQueryString': true }],
      settings: { 'import/resolver': 'webpack' },
    }),

    // #1538: It is impossible to import namespace and other in one line, so allow this.
    test({
      code: "import * as ns from './foo'; import {y} from './foo'",
    }),
    test({
      code: "import {y} from './foo'; import * as ns from './foo'",
    }),
  ],
  invalid: [
    test({
      code: "import { x } from './foo'; import { y } from './foo'",
      output: "import { x , y } from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import {y} from './foo'; import { z } from './foo'",
      output: "import {x,y, z } from './foo';  ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    // ensure resolved path results in warnings
    test({
      code: "import { x } from './bar'; import { y } from 'bar';",
      output: "import { x , y } from './bar'; ",
      settings: { 'import/resolve': {
        paths: [path.join( process.cwd()
          , 'tests', 'files',
        )] } },
      errors: 2, // path ends up hardcoded
    }),

    // #1107: Using different query strings that trigger different webpack loaders.
    test({
      code: "import x from './bar.js?optionX'; import y from './bar?optionX';",
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
    }),
    test({
      code: "import x from './bar?optionX'; import y from './bar?optionY';",
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
    }),

    // #1107: Using same query strings that trigger the same loader.
    test({
      code: "import x from './bar?optionX'; import y from './bar.js?optionX';",
      options: [{ 'considerQueryString': true }],
      settings: { 'import/resolver': 'webpack' },
      errors: 2, // path ends up hardcoded
    }),

    // #86: duplicate unresolved modules should be flagged
    test({
      code: "import foo from 'non-existent'; import bar from 'non-existent';",
      // Autofix bail because of different default import names.
      output: "import foo from 'non-existent'; import bar from 'non-existent';",
      errors: [
        "'non-existent' imported multiple times.",
        "'non-existent' imported multiple times.",
      ],
    }),

    test({
      code: "import type { x } from './foo'; import type { y } from './foo'",
      output: "import type { x , y } from './foo'; ",
      parser: parsers.BABEL_OLD,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import './foo'; import './foo'",
      output: "import './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import { x, /* x */ } from './foo'; import {//y\ny//y2\n} from './foo'",
      output: "import { x, /* x */ //y\ny//y2\n} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import {} from './foo'",
      output: "import {x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import {} from './foo'; import {/*c*/} from './foo'; import {y} from './foo'",
      output: "import {x/*c*/,y} from './foo';   ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import { } from './foo'; import {x} from './foo'",
      output: "import { x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import './foo'; import {x} from './foo'",
      output: "import {x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import'./foo'; import {x} from './foo'",
      output: "import {x} from'./foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import './foo'; import { /*x*/} from './foo'; import {//y\n} from './foo'; import {z} from './foo'",
      output: "import { /*x*///y\nz} from './foo';   ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import './foo'; import def, {x} from './foo'",
      output: "import def, {x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import './foo'; import def from './foo'",
      output: "import def from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import def from './foo'; import {x} from './foo'",
      output: "import def, {x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import def from './foo'",
      output: "import def, {x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import{x} from './foo'; import def from './foo'",
      output: "import def,{x} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import def, {y} from './foo'",
      output: "import def, {x,y} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import * as ns1 from './foo'; import * as ns2 from './foo'",
      // Autofix bail because cannot merge namespace imports.
      output: "import * as ns1 from './foo'; import * as ns2 from './foo'",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import * as ns from './foo'; import {x} from './foo'; import {y} from './foo'",
      // Autofix could merge some imports, but not the namespace import.
      output: "import * as ns from './foo'; import {x,y} from './foo'; ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import {x} from './foo'; import * as ns from './foo'; import {y} from './foo'; import './foo'",
      // Autofix could merge some imports, but not the namespace import.
      output: "import {x,y} from './foo'; import * as ns from './foo';  ",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        // some-tool-disable-next-line
        import {x} from './foo'
        import {//y\ny} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        // some-tool-disable-next-line
        import {x} from './foo'
        import {//y\ny} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        // some-tool-disable-next-line
        import {y} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        // some-tool-disable-next-line
        import {y} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo' // some-tool-disable-line
        import {y} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo' // some-tool-disable-line
        import {y} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import {y} from './foo' // some-tool-disable-line
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import {y} from './foo' // some-tool-disable-line
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        /* comment */ import {y} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        /* comment */ import {y} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import {y} from './foo' /* comment
        multiline */
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import {y} from './foo' /* comment
        multiline */
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
import {x} from './foo'
import {y} from './foo'
// some-tool-disable-next-line
      `,
      // Not autofix bail.
      output: `
import {x,y} from './foo'
// some-tool-disable-next-line
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
import {x} from './foo'
// comment

import {y} from './foo'
      `,
      // Not autofix bail.
      output: `
import {x,y} from './foo'
// comment

      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import/* comment */{y} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import/* comment */{y} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import/* comment */'./foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import/* comment */'./foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import{y}/* comment */from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import{y}/* comment */from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from './foo'
        import{y}from/* comment */'./foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from './foo'
        import{y}from/* comment */'./foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: `
        import {x} from
        // some-tool-disable-next-line
        './foo'
        import {y} from './foo'
      `,
      // Autofix bail because of comment.
      output: `
        import {x} from
        // some-tool-disable-next-line
        './foo'
        import {y} from './foo'
      `,
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    // #2027 long import list generate empty lines
    test({
      code: "import { Foo } from './foo';\nimport { Bar } from './foo';\nexport const value = {}",
      output: "import { Foo , Bar } from './foo';\nexport const value = {}",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    // #2027 long import list generate empty lines
    test({
      code: "import { Foo } from './foo';\nimport Bar from './foo';\nexport const value = {}",
      output: "import Bar, { Foo } from './foo';\nexport const value = {}",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),
  ],
});

context('TypeScript', function () {
  getNonDefaultParsers()
    // Type-only imports were added in TypeScript ESTree 2.23.0
    .filter((parser) => parser !== parsers.TS_OLD)
    .forEach((parser) => {
      const parserConfig = {
        parser,
        settings: {
          'import/parsers': { [parser]: ['.ts'] },
          'import/resolver': { 'eslint-import-resolver-typescript': true },
        },
      };

      ruleTester.run('no-duplicates', rule, {
        valid: [
        // #1667: ignore duplicate if is a typescript type import
          test({
            code: "import type { x } from './foo'; import y from './foo'",
            ...parserConfig,
          }),
          test({
            code: "import type x from './foo'; import type y from './bar'",
            ...parserConfig,
          }),
          test({
            code: "import type {x} from './foo'; import type {y} from './bar'",
            ...parserConfig,
          }),
          test({
            code: "import type x from './foo'; import type {y} from './foo'",
            ...parserConfig,
          }),
          test({
            code: `
              import type {} from './module';
              import {} from './module2';
            `,
            ...parserConfig,
          }),
          test({
            code: `
              import type { Identifier } from 'module';

              declare module 'module2' {
                import type { Identifier } from 'module';
              }

              declare module 'module3' {
                import type { Identifier } from 'module';
              }
            `,
            ...parserConfig,
          }),
        ],
        invalid: [
          test({
            code: "import type x from './foo'; import type y from './foo'",
            ...parserConfig,
            errors: [
              {
                line: 1,
                column: 20,
                message: "'./foo' imported multiple times.",
              },
              {
                line: 1,
                column: 48,
                message: "'./foo' imported multiple times.",
              },
            ],
          }),
          test({
            code: "import type x from './foo'; import type x from './foo'",
            output: "import type x from './foo'; ",
            ...parserConfig,
            errors: [
              {
                line: 1,
                column: 20,
                message: "'./foo' imported multiple times.",
              },
              {
                line: 1,
                column: 48,
                message: "'./foo' imported multiple times.",
              },
            ],
          }),
          test({
            code: "import type {x} from './foo'; import type {y} from './foo'",
            ...parserConfig,
            output: `import type {x,y} from './foo'; `,
            errors: [
              {
                line: 1,
                column: 22,
                message: "'./foo' imported multiple times.",
              },
              {
                line: 1,
                column: 52,
                message: "'./foo' imported multiple times.",
              },
            ],
          }),
        ],
      });
    });
});
