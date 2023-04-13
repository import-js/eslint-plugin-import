import { test } from '../utils';

import { RuleTester } from 'eslint';
import rule from 'rules/exports-last';

const ruleTester = new RuleTester();

const error = (type) => ({
  message: 'Export statements should appear at the end of the file',
  type,
});

ruleTester.run('exports-last', rule, {
  valid: [
    // Empty file
    test({
      code: '// comment',
    }),
    test({
      // No exports
      code: `
        const foo = 'bar'
        const bar = 'baz'
      `,
    }),
    test({
      code: `
        const foo = 'bar'
        export {foo}
      `,
    }),
    test({
      code: `
        const foo = 'bar'
        export default foo
      `,
    }),
    // Only exports
    test({
      code: `
        export default foo
        export const bar = true
      `,
    }),
    test({
      code: `
        const foo = 'bar'
        export default foo
        export const bar = true
      `,
    }),
    // Multiline export
    test({
      code: `
        const foo = 'bar'
        export default function bar () {
          const very = 'multiline'
        }
        export const baz = true
      `,
    }),
    // Many exports
    test({
      code: `
        const foo = 'bar'
        export default foo
        export const so = 'many'
        export const exports = ':)'
        export const i = 'cant'
        export const even = 'count'
        export const how = 'many'
      `,
    }),
    // Export all
    test({
      code: `
        export * from './foo'
      `,
    }),
  ],
  invalid: [
    // Default export before variable declaration
    test({
      code: `
        export default 'bar'
        const bar = true
      `,
      errors: [error('ExportDefaultDeclaration')],
    }),
    // Named export before variable declaration
    test({
      code: `
        export const foo = 'bar'
        const bar = true
      `,
      errors: [error('ExportNamedDeclaration')],
    }),
    // Export all before variable declaration
    test({
      code: `
        export * from './foo'
        const bar = true
      `,
      errors: [error('ExportAllDeclaration')],
    }),
    // Many exports arround variable declaration
    test({
      code: `
        export default 'such foo many bar'
        export const so = 'many'
        const foo = 'bar'
        export const exports = ':)'
        export const i = 'cant'
        export const even = 'count'
        export const how = 'many'
      `,
      errors: [
        error('ExportDefaultDeclaration'),
        error('ExportNamedDeclaration'),
      ],
    }),
  ],
});
