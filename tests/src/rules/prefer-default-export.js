import { test, testVersion, getNonDefaultParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';
import semver from 'semver';
import { version as tsEslintVersion } from 'typescript-eslint-parser/package.json';

const ruleTester = new RuleTester();
const rule = require('../../../src/rules/prefer-default-export');

const SINGLE_EXPORT_ERROR_MESSAGE = 'Prefer default export on a file with single export.';
const ANY_EXPORT_ERROR_MESSAGE = 'Prefer default export to be present on every file that has export.';

// test cases for default option { target: 'single' }
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
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const foo = 'foo';`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };`,
      errors: [{
        type: 'ExportSpecifier',
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const { foo } = { foo: "bar" };`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const { foo: { bar } } = { foo: { bar: "baz" } };`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const [a] = ["foo"]`,
      errors: [{
        type: 'ExportNamedDeclaration',
        message: SINGLE_EXPORT_ERROR_MESSAGE,
      }],
    }),
  ],
});

// test cases for { target: 'any' }
ruleTester.run('prefer-default-export', rule, {
  // Any exporting file must contain default export
  valid: [].concat(
    test({
      code: `
          export default function bar() {};`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `
              export const foo = 'foo';
              export const bar = 'bar';
              export default 42;`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `
            export default a = 2;`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `
            export const a = 2;
            export default function foo() {};`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `
          export const a = 5;
          export function bar(){};
          let foo;
          export { foo as default }`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `
          export * from './foo';`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `export Memory, { MemoryValue } from './Memory'`,
      parser: parsers.BABEL_OLD,
      options: [{
        target: 'any',
      }],
    }),
    // no exports at all
    test({
      code: `
            import * as foo from './foo';`,
      options: [{
        target: 'any',
      }],
    }),
    test({
      code: `const a = 5;`,
      options: [{
        target: 'any',
      }],
    }),
    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'export const a = 4; let foo; export { foo as "default" };',
      options: [{
        target: 'any',
      }],
      parserOptions: { ecmaVersion: 2022 },
    })),
  ),
  // { target: 'any' } invalid cases when any exporting file must contain default export but does not
  invalid: [].concat(
    test({
      code: `
        export const foo = 'foo';
        export const bar = 'bar';`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const foo = 'foo';
        export function bar() {};`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        let foo, bar;
        export { foo, bar }`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        let item;
        export const foo = item;
        export { item };`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: 'export { a, b } from "foo.js"',
      parser: parsers.BABEL_OLD,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        const foo = 'foo';
        export { foo };`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const { foo } = { foo: "bar" };`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
    test({
      code: `
        export const { foo: { bar } } = { foo: { bar: "baz" } };`,
      options: [{
        target: 'any',
      }],
      errors: [{
        message: ANY_EXPORT_ERROR_MESSAGE,
      }],
    }),
  ),
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

    ruleTester.run('prefer-default-export', rule, {
      valid: [].concat(
        // Exporting types
        semver.satisfies(tsEslintVersion, '>= 22') ? test({
          code: `
            export type foo = string;
            export type bar = number;
            /* ${parser.replace(process.cwd(), '$$PWD')} */
          `,
          ...parserConfig,
        }) : [],
        test({
          code: `
            export type foo = string;
            export type bar = number;
            /* ${parser.replace(process.cwd(), '$$PWD')} */
          `,
          ...parserConfig,
        }),
        semver.satisfies(tsEslintVersion, '>= 22') ? test({
          code: 'export type foo = string /* ' + parser.replace(process.cwd(), '$$PWD') + '*/',
          ...parserConfig,
        }) : [],
        semver.satisfies(tsEslintVersion, '> 20') ? test({
          code: 'export interface foo { bar: string; } /* ' + parser.replace(process.cwd(), '$$PWD') + '*/',
          ...parserConfig,
        }) : [],
        test({
          code: 'export interface foo { bar: string; }; export function goo() {} /* ' + parser.replace(process.cwd(), '$$PWD') + '*/',
          ...parserConfig,
        }),
      ),
      invalid: [],
    });
  });
});
