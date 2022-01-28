import { test, testVersion, getNonDefaultParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';
import babelPluginSyntaxTypeScript from '@babel/plugin-syntax-typescript';

const ruleTester = new RuleTester();
const rule = require('../../../src/rules/prefer-default-export');

ruleTester.run('prefer-default-export', rule, {
  valid: [].concat(
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
        export const [a, b] = item;`,
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
      parser: parsers.BABEL_OLD,
    }),

    // no exports at all
    test({
      code: `
        import * as foo from './foo';`,
    }),

    test({
      code: `export type UserId = number;`,
      parser: parsers.BABEL_OLD,
    }),

    // issue #653
    test({
      code: 'export default from "foo.js"',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export { a, b } from "foo.js"',
      parser: parsers.BABEL_OLD,
    }),
    // ...SYNTAX_CASES,
    test({
      code: `
        export const [CounterProvider,, withCounter] = func();;
      `,
      parser: parsers.BABEL_OLD,
    }),
    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'let foo; export { foo as "default" };',
      parserOptions: { ecmaVersion: 2022 },
    })),
  ),
  invalid: [
    test({
      code: `
        export function bar() {};`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const foo = 'foo';`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };`,
      errors: [{
        type: 'ExportSpecifier',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const { foo } = { foo: "bar" };`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const { foo: { bar } } = { foo: { bar: "baz" } };`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
    test({
      code: `
        export const [a] = ["foo"]`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: 'Prefer default export.',
      }],
    }),
  ],
});

context('TypeScript', function () {
  getNonDefaultParsers().forEach((parser) => {
    const parserConfig = {
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    };
    if (parser === parsers.BABEL_NEW) {
      parserConfig.parserOptions =  {
        requireConfigFile: false,
        babelOptions: {
          plugins: [babelPluginSyntaxTypeScript],
        },
      };
    }

    ruleTester.run('prefer-default-export', rule, {
      valid: [
        // Exporting types
        test({
          code: `
          export type foo = string;
          export type bar = number;`,
          ...parserConfig,
        }),
        test({
          code: `
          export type foo = string;
          export type bar = number;`,
          ...parserConfig,
        }),
        test({
          code: 'export type foo = string',
          ...parserConfig,
        }),
        test({
          code: 'export type foo = string',
          ...parserConfig,
        }),
        test({
          code: 'export interface foo { bar: string; }',
          ...parserConfig,
        }),
        test({
          code: 'export interface foo { bar: string; }; export function goo() {}',
          ...parserConfig,
        }),
      ],
      invalid: [],
    });
  });
});
