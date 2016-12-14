import { test } from '../utils'

import { RuleTester } from 'eslint'
import rule from 'rules/exports-last'

const ruleTester = new RuleTester()

const errors = ['Export statements should appear at the end of the file']

ruleTester.run('exports-last', rule, {
  valid: [
    test({
      code: `
        const foo = 'bar';
        const bar = 'baz';
      `,
    }),
    test({
      code: `
        const foo = 'bar';
        export {foo};
      `,
    }),
    test({
      code: `
        const foo = 'bar';
        export default foo;
      `,
    }),
    test({
      code: `
        const foo = 'bar';
        export default foo;
        export const bar = true;
      `,
    }),

  ],
  invalid: [
    test({
      code: `
        export default 'bar';
        const bar = true;
      `,
      errors,
    }),
    test({
      code: `
        export const foo = 'bar';
        const bar = true;
      `,
      errors,
    }),
  ],
})
