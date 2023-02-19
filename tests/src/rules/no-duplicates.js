import * as path from 'path';
import { test as testUtil, getNonDefaultParsers, parsers, tsVersionSatisfies, typescriptEslintParserSatisfies } from '../utils';
import jsxConfig from '../../../config/react';

import { RuleTester } from 'eslint';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester();
const rule = require('rules/no-duplicates');

// autofix only possible with eslint 4+
const test = semver.satisfies(eslintPkg.version, '< 4')
  ? (t) => testUtil({ ...t, output: t.code })
  : testUtil;

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: "import { x } from './foo'; import { y } from './bar'" }),

    // #86: every unresolved module should not show up as 'null' and duplicate
    test({ code: 'import foo from "234artaf"; import { shoop } from "234q25ad"' }),

    // #225: ignore duplicate if is a flow type import
    test({
      code: "import { x } from './foo'; import type { y } from './foo'",
      parser: parsers.BABEL_OLD,
    }),

    // #1107: Using different query strings that trigger different webpack loaders.
    test({
      code: "import x from './bar?optionX'; import y from './bar?optionY';",
      options: [{ considerQueryString: true }],
      settings: { 'import/resolver': 'webpack' },
    }),
    test({
      code: "import x from './foo'; import y from './bar';",
      options: [{ considerQueryString: true }],
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
      settings: {
        'import/resolve': {
          paths: [path.join(process.cwd(), 'tests', 'files')],
        },
      },
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
      options: [{ considerQueryString: true }],
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
      code: "import type { x } from './foo'; import type { y } from './foo';",
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

    // These test cases use duplicate import identifiers, which causes a fatal parsing error using ESPREE (default) and TS_OLD.
    ...flatMap([parsers.BABEL_OLD, parsers.TS_NEW], (parser) => {
      if (!parser) { return []; } // TS_NEW is not always available
      return [
        // #2347: duplicate identifiers should be removed
        test({
          code: "import {a} from './foo'; import { a } from './foo'",
          output: "import {a} from './foo'; ",
          errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
          parser,
        }),

        // #2347: duplicate identifiers should be removed
        test({
          code: "import {a,b} from './foo'; import { b, c } from './foo'; import {b,c,d} from './foo'",
          output: "import {a,b, c ,d} from './foo';  ",
          errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
          parser,
        }),

        // #2347: duplicate identifiers should be removed, but not if they are adjacent to comments
        test({
          code: "import {a} from './foo'; import { a/*,b*/ } from './foo'",
          output: "import {a, a/*,b*/ } from './foo'; ",
          errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
          parser,
        }),
      ];
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

    test({
      code: `
        import {
          DEFAULT_FILTER_KEYS,
          BULK_DISABLED,
        } from '../constants';
        import React from 'react';
        import {
          BULK_ACTIONS_ENABLED
        } from '../constants';

        const TestComponent = () => {
          return <div>
          </div>;
        }

        export default TestComponent;
      `,
      output: `
        import {
          DEFAULT_FILTER_KEYS,
          BULK_DISABLED,
        
          BULK_ACTIONS_ENABLED
        } from '../constants';
        import React from 'react';
        
        const TestComponent = () => {
          return <div>
          </div>;
        }

        export default TestComponent;
      `,
      errors: ["'../constants' imported multiple times.", "'../constants' imported multiple times."],
      ...jsxConfig,
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

      const valid = [
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
      ].concat(!tsVersionSatisfies('>= 4.5') || !typescriptEslintParserSatisfies('>= 5.7.0') ? [] : [
        test({
          code: "import { type x } from './foo'; import type y from 'foo'",
          ...parserConfig,
        }),
      ]);

      const invalid = [
        // if this is what we find, then inline regardless of TS version. We don't convert back to `type { x }`
        test({
          code: "import { type x } from './foo'; import y from './foo';",
          output: " import y, {type x} from './foo';",
          ...parserConfig,
          errors: [
            {
              line: 1,
              column: 24,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 47,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import type x from './foo'; import type y from './foo'",
          output: "import type x from './foo'; import type y from './foo'", // warn but no fixes
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
        test({
          code: "import {type x} from './foo'; import {y} from './foo'",
          ...parserConfig,
          output: `import {type x, y} from './foo'; `,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 47,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
      ].concat(!tsVersionSatisfies('>= 4.5') || !typescriptEslintParserSatisfies('>= 5.7.0') ? [] : [
        // without prefer-inline, will dedupe with type import kind
        test({
          code: "import type {x} from './foo'; import {type y} from './foo'",
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          output: `import type {x, y} from './foo'; `,
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
        // with prefer-inline, will dedupe with inline type specifier
        test({
          code: "import type {x} from './foo';import {type y} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import {type y, type x} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // (same as above with imports switched up) without prefer-inline, will dedupe with type import kind
        test({
          code: "import {type x} from './foo'; import type {y} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          output: ` import type {y, x} from './foo';`,
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
        // with prefer-inline, will dedupe with inline type specifier
        test({
          code: "import {type x} from 'foo'; import type {y} from 'foo'",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import {type x, type y} from 'foo'; `,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'foo' imported multiple times.",
            },
            {
              line: 1,
              column: 50,
              message: "'foo' imported multiple times.",
            },
          ],
        }),
        // throw in a Value import
        test({
          code: "import {type x, C} from './foo'; import type {y} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          output: `import { C} from './foo'; import type {y, x} from './foo';`,
          errors: [
            {
              line: 1,
              column: 25,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 55,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // (same as above but import statements switched)
        test({
          code: "import type {y} from './foo'; import {type x, C} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          output: `import type {y, x} from './foo'; import { C} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 55,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // with prefer-inline, will dedupe with inline type specifier
        test({
          code: "import {type x, C} from 'foo';import type {y} from 'foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import {type x, C, type y} from 'foo';`,
          errors: [
            {
              line: 1,
              column: 25,
              message: "'foo' imported multiple times.",
            },
            {
              line: 1,
              column: 52,
              message: "'foo' imported multiple times.",
            },
          ],
        }),
        // (same as above but import statements switched)
        test({
          code: "import type {y} from './foo'; import {type x, C} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: ` import {type x, C, type y} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 55,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // inlines types will still dedupe without prefer-inline
        test({
          code: `import {type x} from './foo';import {type y} from './foo';`,
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          output: `import {type x, type y} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // inlines types will dedupe with prefer-inline
        test({
          code: `import {type x} from './foo';import {type y} from './foo';`,
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import {type x, type y} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // 3 imports
        test({
          code: `import {type x} from './foo';import {type y} from './foo';import {type z} from './foo';`,
          ...parserConfig,
          output: "import {type x, type y, type z} from './foo';",
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 80,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // 3 imports with default import
        test({
          code: "import {type x} from './foo';import {type y} from './foo';import A from './foo';",
          ...parserConfig,
          output: "import A, {type x, type y} from './foo';",
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 73,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // 3 imports with default import + value import
        test({
          code: "import {type x} from './foo';import {type y} from './foo';import A, { C } from './foo';",
          ...parserConfig,
          output: "import A, { C , type x, type y} from './foo';",
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 51,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 80,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // mixed imports - dedupe existing inline types without prefer-inline
        test({
          code: "import {AValue, type x, BValue} from './foo';import {type y, CValue} from './foo';",
          ...parserConfig,
          output: "import {AValue, type x, BValue, type y, CValue} from './foo';",
          errors: [
            {
              line: 1,
              column: 38,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 75,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import AValue from './foo'; import {type y} from './foo';",
          ...parserConfig,
          output: "import AValue, {type y} from './foo'; ",
          errors: [
            {
              line: 1,
              column: 20,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 50,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // switch it up
        test({
          code: "import {type y} from './foo';import AValue from './foo';",
          ...parserConfig,
          output: `import AValue, {type y} from './foo';`,
          errors: [
            {
              line: 1,
              column: 22,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 49,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import AValue, {BValue} from './foo'; import {type y, CValue} from './foo';",
          ...parserConfig,
          output: "import AValue, {BValue, type y, CValue} from './foo'; ",
          errors: [
            {
              line: 1,
              column: 30,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 68,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // will unfurl inline types to type import if not prefer-inline
        test({
          code: "import {AValue, type x, BValue} from './foo'; import type {y} from './foo';",
          ...parserConfig,
          output: "import {AValue,  BValue} from './foo'; import type {y, x} from './foo';",
          errors: [
            {
              line: 1,
              column: 38,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 68,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        // will dedupe inline type imports with prefer-inline
        test({
          code: "import {AValue, type x, BValue} from './foo'; import type {y} from './foo'",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: "import {AValue, type x, BValue, type y} from './foo'; ",
          errors: [
            {
              line: 1,
              column: 38,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 68,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import AValue, {type x, BValue} from './foo';import type {y} from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': false }],
          // don't want to lose type information
          output: "import AValue, { BValue} from './foo';import type {y, x} from './foo';",
          errors: [
            {
              line: 1,
              column: 38,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 67,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import AValue, {type x, BValue} from './foo'; import type {y} from './foo'",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import AValue, {type x, BValue, type y} from './foo'; `,
          errors: [
            {
              line: 1,
              column: 38,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 68,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
        test({
          code: "import { type C, } from './foo';import {AValue, BValue, } from './foo';",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: "import { type C,  AValue, BValue} from './foo';",
          errors: [
            {
              line: 1,
              column: 25,
              message: "'./foo' imported multiple times.",
            },
            {
              line: 1,
              column: 64,
              message: "'./foo' imported multiple times.",
            }
          ],
        }),
        // #2834 Detect duplicates across type and regular imports
        test({
          code: "import {AValue} from './foo'; import type {AType} from './foo'",
          ...parserConfig,
          options: [{ 'prefer-inline': true }],
          output: `import {AValue,type AType} from './foo'; `,
          errors: [
            {
              line: 1,
              column: 22,
              column: 56,
              message: "'./foo' imported multiple times.",
            },
          ],
        }),
      ]);

      ruleTester.run('no-duplicates', rule, {
        valid,
        invalid,
      });
    });
});
