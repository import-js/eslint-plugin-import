import { test, SYNTAX_CASES } from '../utils'

import { RuleTester } from 'eslint'

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
    test({ code: 'export { foo, foo as bar }' }),
    test({ code: 'export { bar }; export * from "./export-all"' }),
    test({ code: 'export * from "./export-all"' }),
    test({ code: 'export * from "./does-not-exist"' }),

    // #328: "export * from" does not export a default
    test({ code: 'export default foo; export * from "./bar"' }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    // multiple defaults
    test({
      code: 'export default foo; export default bar',
      errors: ['Multiple default exports.', 'Multiple default exports.'],
    }),
    test({
      code: 'export default function foo() {}; ' +
                 'export default function bar() {}',
      errors: ['Multiple default exports.', 'Multiple default exports.'],
    }),

    test({
      code: 'export function foo() {}; ' +
                 'export { bar as foo }',
      errors: ["Multiple exports of name 'foo'.", "Multiple exports of name 'foo'."],
    }),
    test({
      code: 'export {foo}; export {foo};',
      errors: ["Multiple exports of name 'foo'.", "Multiple exports of name 'foo'."],
    }),
    test({
      code: 'export {foo}; export {bar as foo};',
      errors: ["Multiple exports of name 'foo'.", "Multiple exports of name 'foo'."],
    }),
    test({
      code: 'export var foo = "foo"; export var foo = "bar";',
      errors: ["Multiple exports of name 'foo'.", "Multiple exports of name 'foo'."],
    }),
    test({
      code: 'export var foo = "foo", foo = "bar";',
      errors: ["Multiple exports of name 'foo'.", "Multiple exports of name 'foo'."],
    }),
    test({
      code: 'export { foo }; export * from "./export-all"',
      errors: ['Multiple exports of name \'foo\'.',
               'Multiple exports of name \'foo\'.'],
    }),
    // test({ code: 'export * from "./default-export"'
    //      , errors: [{ message: 'No named exports found in module ' +
    //                            '\'./default-export\'.'
    //                 , type: 'Literal' }] }),

    test({
      code: 'export * from "./malformed.js"',
      errors: [{
        message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
        type: 'Literal',
      }],
    }),

    test({
      code: 'export var { foo, bar } = object; export var foo = "bar"',
      errors: ['Multiple exports of name \'foo\'.',
               'Multiple exports of name \'foo\'.'],
    }),
    test({
      code: 'export var { bar: { foo } } = object; export var foo = "bar"',
      errors: ['Multiple exports of name \'foo\'.',
               'Multiple exports of name \'foo\'.'],
    }),
    test({
      code: 'export var [ foo, bar ] = array; export var bar = "baz"',
      errors: ['Multiple exports of name \'bar\'.',
               'Multiple exports of name \'bar\'.'],
    }),
    test({
      code: 'export var [ foo, /*sparse*/, { bar } ] = array; export var bar = "baz"',
      errors: ['Multiple exports of name \'bar\'.',
               'Multiple exports of name \'bar\'.'],
    }),


    // #328: "export * from" does not export a default
    test({
      code: 'export * from "./default-export"',
      errors: [`No named exports found in module './default-export'.`],
    }),
  ],
})
