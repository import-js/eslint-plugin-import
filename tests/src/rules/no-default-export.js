import { parsers, test, testVersion } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-default-export');

ruleTester.run('no-default-export', rule, {
  valid: [
    test({
      code: `
        export const foo = 'foo';
        export const bar = 'bar';
      `,
    }),
    test({
      code: `
        export const foo = 'foo';
        export function bar() {};
      `,
    }),
    test({
      code: `export const foo = 'foo';`,
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };
      `,
    }),
    test({
      code: `let foo, bar; export { foo, bar }`,
    }),
    test({
      code: `export const { foo, bar } = item;`,
    }),
    test({
      code: `export const { foo, bar: baz } = item;`,
    }),
    test({
      code: `export const { foo: { bar, baz } } = item;`,
    }),
    test({
      code: `
        let item;
        export const foo = item;
        export { item };
      `,
    }),
    test({
      code: `export * from './foo';`,
    }),
    test({
      code: `export const { foo } = { foo: "bar" };`,
    }),
    test({
      code: `export const { foo: { bar } } = { foo: { bar: "baz" } };`,
    }),
    test({
      code: 'export { a, b } from "foo.js"',
      parser: parsers.BABEL_OLD,
    }),

    // no exports at all
    test({
      code: `import * as foo from './foo';`,
    }),
    test({
      code: `import foo from './foo';`,
    }),
    test({
      code: `import {default as foo} from './foo';`,
    }),

    test({
      code: `export type UserId = number;`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export foo from "foo.js"',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `export Memory, { MemoryValue } from './Memory'`,
      parser: parsers.BABEL_OLD,
    }),
  ],
  invalid: [].concat(
    testVersion('> 2', () => ({
      code: 'export default function bar() {};',
      errors: [
        {
          type: 'ExportDefaultDeclaration',
          message: 'Prefer named exports.',
          line: 1,
          column: 8,
        },
      ],
    })),
    testVersion('> 2', () => ({
      code: `
        export const foo = 'foo';
        export default bar;`,
      errors: [
        {
          type: 'ExportDefaultDeclaration',
          message: 'Prefer named exports.',
          line: 3,
          column: 16,
        },
      ],
    })),
    testVersion('> 2', () => ({
      code: 'export default class Bar {};',
      errors: [
        {
          type: 'ExportDefaultDeclaration',
          message: 'Prefer named exports.',
          line: 1,
          column: 8,
        },
      ],
    })),
    testVersion('> 2', () => ({
      code: 'export default function() {};',
      errors: [
        {
          type: 'ExportDefaultDeclaration',
          message: 'Prefer named exports.',
          line: 1,
          column: 8,
        },
      ],
    })),
    testVersion('> 2', () => ({
      code: 'export default class {};',
      errors: [
        {
          type: 'ExportDefaultDeclaration',
          message: 'Prefer named exports.',
          line: 1,
          column: 8,
        },
      ],
    })),
    test({
      code: 'let foo; export { foo as default }',
      errors: [
        {
          type: 'ExportNamedDeclaration',
          message: 'Do not alias `foo` as `default`. Just export `foo` itself instead.',
        },
      ],
    }),
    test({
      code: 'export default from "foo.js"',
      parser: parsers.BABEL_OLD,
      errors: [
        {
          type: 'ExportNamedDeclaration',
          message: 'Prefer named exports.',
        },
      ],
    }),
    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'let foo; export { foo as "default" }',
      errors: [
        {
          type: 'ExportNamedDeclaration',
          message: 'Do not alias `foo` as `default`. Just export `foo` itself instead.',
        },
      ],
      parserOptions: { ecmaVersion: 2022 },
    })),
  ),
});
