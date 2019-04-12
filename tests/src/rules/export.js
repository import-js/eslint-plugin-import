import { test, SYNTAX_CASES } from '../utils'

import { RuleTester, linter } from 'eslint'
import semver from 'semver'

var ruleTester = new RuleTester()
  , rule = require('rules/export')

ruleTester.run('export', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    // default
    test({ code: 'var foo = "foo"; export default foo;' }),
    test({ code: 'export var foo = "foo"; export var bar = "bar";'}),
    test({ code: 'export var foo = "foo", bar = "bar";' }),
    test({ code: 'export var { foo, bar } = object;' }),
    test({ code: 'export var [ foo, bar ] = array;' }),
    test({ code: 'export var { foo, bar } = object;' }),
    test({ code: 'export var [ foo, bar ] = array;' }),
    test({ code: 'let foo; export { foo, foo as bar }' }),
    test({ code: 'let bar; export { bar }; export * from "./export-all"' }),
    test({ code: 'export * from "./export-all"' }),
    test({ code: 'export * from "./does-not-exist"' }),

    // #328: "export * from" does not export a default
    test({ code: 'export default foo; export * from "./bar"' }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    // multiple defaults
    // test({
    //   code: 'export default foo; export default bar',
    //   errors: ['Multiple default exports.', 'Multiple default exports.'],
    // }),
    // test({
    //   code: 'export default function foo() {}; ' +
    //              'export default function bar() {}',
    //   errors: ['Multiple default exports.', 'Multiple default exports.'],
    // }),

    // test({
    //   code: 'export function foo() {}; ' +
    //              'export { bar as foo }',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export {foo}; export {foo};',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export {foo}; export {bar as foo};',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var foo = "foo"; export var foo = "bar";',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var foo = "foo", foo = "bar";',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    test({
      code: 'let foo; export { foo }; export * from "./export-all"',
      errors: ['Multiple exports of name \'foo\'.',
               'Multiple exports of name \'foo\'.'],
    }),
    // test({ code: 'export * from "./default-export"'
    //      , errors: [{ message: 'No named exports found in module ' +
    //                            '\'./default-export\'.'
    //                 , type: 'Literal' }] }),

    // note: Espree bump to Acorn 4+ changed this test's error message.
    //       `npm up` first if it's failing.
    test({
      code: 'export * from "./malformed.js"',
      errors: [{
        message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
        type: 'Literal',
      }],
    }),

    // test({
    //   code: 'export var { foo, bar } = object; export var foo = "bar"',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var { bar: { foo } } = object; export var foo = "bar"',
    //   errors: ['Parsing error: Duplicate export \'foo\''],
    // }),
    // test({
    //   code: 'export var [ foo, bar ] = array; export var bar = "baz"',
    //   errors: ['Parsing error: Duplicate export \'bar\''],
    // }),
    // test({
    //   code: 'export var [ foo, /*sparse*/, { bar } ] = array; export var bar = "baz"',
    //   errors: ['Parsing error: Duplicate export \'bar\''],
    // }),


    // #328: "export * from" does not export a default
    test({
      code: 'export * from "./default-export"',
      errors: [`No named exports found in module './default-export'.`],
    }),
  ],
})


context('Typescript', function () {
  // Typescript
  const parsers = ['typescript-eslint-parser']

  if (semver.satisfies(linter.version, '>5.0.0')) {
    parsers.push('@typescript-eslint/parser')
  }

  parsers.forEach((parser) => {
    const parserConfig = {
      parser: parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }

    ruleTester.run('export', rule, {
      valid: [
        test(Object.assign({
          code: `
            export const Foo = 1;
            export type Foo = number;
          `,
        }, parserConfig),
        test(Object.assign({
          code: `
            export const Foo = 1;
            export interface Foo {}
          `,
        }, parserConfig))),
      ],
      invalid: [],
    })
  })
})
