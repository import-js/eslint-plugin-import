import { babelSyntaxPlugins, getBabelParserConfig, getBabelParsers, test, testVersion } from '../utils';

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

context('Babel Parsers', () => {
  getBabelParsers().forEach((parser) => {
    const parserConfig = getBabelParserConfig(
      parser, { plugins: [babelSyntaxPlugins.flow, babelSyntaxPlugins.exportDefaultFrom] },
    );
    ruleTester.run('no-default-export', rule, {
      valid: [
        test({
          code: 'export { a, b } from "foo.js"',
          ...parserConfig,
        }),
        test({
          code: `export type UserId = number;`,
          ...parserConfig,
        }),
        test({
          code: 'export foo from "foo.js"',
          ...parserConfig,
        }),
        test({
          code: `export Memory, { MemoryValue } from './Memory'`,
          ...parserConfig,
        }),
      ],
      invalid: [
        test({
          code: 'export default from "foo.js"',
          errors: [
            {
              type: 'ExportNamedDeclaration',
              message: 'Prefer named exports.',
            },
          ],
          ...parserConfig,
        }),
      ],
    });
  });
});
