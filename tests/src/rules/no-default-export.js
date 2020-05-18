import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-default-export')

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
      parser: require.resolve('babel-eslint'),
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
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export foo from "foo.js"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: `export Memory, { MemoryValue } from './Memory'`,
      parser: require.resolve('babel-eslint'),
    }),

    // acceptable if allowAliasing is true
    test({
      code: 'export { foo as default } from "./foo";',
      options: [{ allowAliasing: true }],
    }),
  ],
  invalid: [
    test({
      code: 'export default function bar() {};',
      errors: [{
        type: 'ExportDefaultDeclaration',
        message: 'Prefer named exports.',
      }],
    }),
    test({
      code: `
        export const foo = 'foo';
        export default bar;`,
      errors: [{
        type: 'ExportDefaultDeclaration',
        message: 'Prefer named exports.',
      }],
    }),
    test({
      code: 'let foo; export { foo as default }',
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Do not alias `foo` as `default`. Just export `foo` itself ' +
          'instead.',
      }],
    }),
    test({
      code: 'export default from "foo.js"',
      parser: require.resolve('babel-eslint'),
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer named exports.',
      }],
    }),
    // still errors if allowAliasing=true
    test({
      code: 'export default function bar() {};',
      errors: [{
        type: 'ExportDefaultDeclaration',
        message: 'Prefer named exports.',
      }],
      options: [{ allowAliasing: true }],
    }),
  ],
})
