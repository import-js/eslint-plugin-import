import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-named-default')

ruleTester.run('no-named-default', rule, {
  valid: [
    test({code: 'import bar from "./bar";'}),
    test({code: 'import bar, { foo } from "./bar";'}),

    // es7
    test({ code: 'import bar from "./bar";', parser: 'babel-eslint' }),
    test({ code: 'import bar, { foo } from "./bar";', parser: 'babel-eslint' }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    test({
      code: 'import { default as foo } from "./foo";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ImportDefaultSpecifier' } ] }),
    test({
      code: 'import { foo, default as bar } from "./baz";',
      errors: [ {
        message: 'Using exported name \'bar\' as identifier for default export.'
      , type: 'ImportDefaultSpecifier' } ] }),
  ],
})
