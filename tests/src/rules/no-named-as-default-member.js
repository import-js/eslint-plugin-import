import { test, SYNTAX_CASES } from '../utils'
import {RuleTester} from 'eslint'
import rule from 'rules/no-named-as-default-member'

const ruleTester = new RuleTester()

ruleTester.run('no-named-as-default-member', rule, {
  valid: [
    test({code: 'import bar, {foo} from "./bar";'}),
    test({code: 'import bar from "./bar"; const baz = bar.baz'}),
    test({code: 'import {foo} from "./bar"; const baz = foo.baz;'}),
    test({code: 'import * as named from "./named-exports"; const a = named.a'}),
    test({code: 'import foo from "./default-export-default-property"; const a = foo.default'}),

    ...SYNTAX_CASES,
  ],

  invalid: [
    test({
      code: 'import bar from "./bar"; const foo = bar.foo;',
      errors: [{
        message: (
          'Caution: `bar` also has a named export `foo`. ' +
          'Check if you meant to write `import {foo} from \'./bar\'` instead.'
        ),
        type: 'MemberExpression',
      }],
    }),
    test({
      code: 'import bar from "./bar"; bar.foo();',
      errors: [{
        message: (
          'Caution: `bar` also has a named export `foo`. ' +
          'Check if you meant to write `import {foo} from \'./bar\'` instead.'
        ),
        type: 'MemberExpression',
      }],
    }),
    test({
      code: 'import bar from "./bar"; const {foo} = bar;',
      errors: [{
        message: (
          'Caution: `bar` also has a named export `foo`. ' +
          'Check if you meant to write `import {foo} from \'./bar\'` instead.'
        ),
        type: 'Identifier',
      }],
    }),
    test({
      code: 'import bar from "./bar"; const {foo: foo2, baz} = bar;',
      errors: [{
        message: (
          'Caution: `bar` also has a named export `foo`. ' +
          'Check if you meant to write `import {foo} from \'./bar\'` instead.'
        ),
        type: 'Identifier',
      }],
    }),
  ],
})
