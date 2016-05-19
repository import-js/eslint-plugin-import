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
        export const foo = 'foo';
        export default bar;`,
      }),
    test({
      code: `
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
        export const foo = item;
        export { item };`,
      }),
    test({
      code: `
        export { foo as default }`,
      }),
    test({
      code: `
        export * from './foo';`,
      }),

    // no exports at all
    test({
      code: `
        import * as foo from './foo';`,
      }),

    // ...SYNTAX_CASES,
  ],
  invalid: [
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
