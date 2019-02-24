import { RuleTester } from 'eslint'
import { test } from '../utils'

const ruleTester = new RuleTester()
    , rule = require('rules/no-named-export')

ruleTester.run('no-named-export', rule, {
  valid: [
    test({
      code: 'export default function bar() {};',
    }),
    test({
      code: 'let foo; export { foo as default }',
    }),
    test({
      code: 'export default from "foo.js"',
      parser: 'babel-eslint',
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
  ],
  invalid: [
    test({
      code: `
        export const foo = 'foo';
        export const bar = 'bar';
      `,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }, {
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `
        export const foo = 'foo';
        export default bar;`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `
        export const foo = 'foo';
        export function bar() {};
      `,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }, {
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const foo = 'foo';`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };
      `,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `let foo, bar; export { foo, bar }`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const { foo, bar } = item;`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const { foo, bar: baz } = item;`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const { foo: { bar, baz } } = item;`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `
        let item;
        export const foo = item;
        export { item };
      `,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }, {
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export * from './foo';`,
      errors: [{
        ruleId: 'ExportAllDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const { foo } = { foo: "bar" };`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export const { foo: { bar } } = { foo: { bar: "baz" } };`,
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: 'export { a, b } from "foo.js"',
      parser: 'babel-eslint',
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export type UserId = number;`,
      parser: 'babel-eslint',
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: 'export foo from "foo.js"',
      parser: 'babel-eslint',
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
    test({
      code: `export Memory, { MemoryValue } from './Memory'`,
      parser: 'babel-eslint',
      errors: [{
        ruleId: 'ExportNamedDeclaration',
        message: 'Named exports are not allowed.',
      }],
    }),
  ],
})
