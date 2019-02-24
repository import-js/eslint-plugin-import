import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/prefer-default-export')

ruleTester.run('prefer-default-export', rule, {
  valid: [
    test({
      code: `
        export const foo = 'foo';
        export const bar = 'bar';`,
      }),
    test({
      code: `
        export default function bar() {};`,
      }),
    test({
      code: `
        export const foo = 'foo';
        export function bar() {};`,
      }),
    test({
      code: `
        export const foo = 'foo';
        export default bar;`,
      }),
    test({
      code: `
        let foo, bar;
        export { foo, bar }`,
      }),
    test({
      code: `
        export const { foo, bar } = item;`,
      }),
    test({
      code: `
        export const { foo, bar: baz } = item;`,
      }),
    test({
      code: `
        export const { foo: { bar, baz } } = item;`,
      }),
    test({
      code: `
        let item;
        export const foo = item;
        export { item };`,
      }),
    test({
      code: `
        let foo;
        export { foo as default }`,
      }),
    test({
      code: `
        export * from './foo';`,
      }),
    test({
      code: `export Memory, { MemoryValue } from './Memory'`,
      parser: 'babel-eslint',
      }),

    // no exports at all
    test({
      code: `
        import * as foo from './foo';`,
      }),

    test({
      code: `export type UserId = number;`,
      parser: 'babel-eslint',
      }),

    // issue #653
    test({
      code: 'export default from "foo.js"',
      parser: 'babel-eslint',
    }),
    test({
      code: 'export { a, b } from "foo.js"',
      parser: 'babel-eslint',
    }),

    // ...SYNTAX_CASES,
  ],
  invalid: [
    test({
      code: `
        export function bar() {};`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const foo = 'foo';`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const { foo } = { foo: "bar" };`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const { foo: { bar } } = { foo: { bar: "baz" } };`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
  ],
})
