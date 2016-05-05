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
        export { foo as default }`,
      }),
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
  ],
})
