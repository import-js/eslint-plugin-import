import { test, testVersion, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'
import rule from 'rules/no-named-as-default-member'

const ruleTester = new RuleTester()

ruleTester.run('no-named-as-default-member', rule, {
  valid: [].concat(
    test({ code: 'import bar, {foo} from "./bar";' }),
    test({ code: 'import bar from "./bar"; const baz = bar.baz' }),
    test({ code: 'import {foo} from "./bar"; const baz = foo.baz;' }),
    test({
      code: 'import * as named from "./named-exports"; const a = named.a',
    }),
    test({
      code: 'import foo from "./default-export-default-property"; const a = foo.default',
    }),

    // es2022: Arbitrary module namespace identifier names
    testVersion('>= 8.7', () => ({
      code: 'import bar, { foo } from "./export-default-string-and-named"',
      parserOptions: { ecmaVersion: 2022 },
    })),

    ...SYNTAX_CASES,
  ),

  invalid: [].concat(
    test({
      code: 'import bar from "./bar"; const foo = bar.foo;',
      errors: [
        {
          message:
            "Caution: `bar` also has a named export `foo`. Check if you meant to write `import {foo} from './bar'` instead.",
          type: 'MemberExpression',
        },
      ],
    }),
    test({
      code: 'import bar from "./bar"; bar.foo();',
      errors: [
        {
          message:
            "Caution: `bar` also has a named export `foo`. Check if you meant to write `import {foo} from './bar'` instead.",
          type: 'MemberExpression',
        },
      ],
    }),
    test({
      code: 'import bar from "./bar"; const {foo} = bar;',
      errors: [
        {
          message:
            "Caution: `bar` also has a named export `foo`. Check if you meant to write `import {foo} from './bar'` instead.",
          type: 'Identifier',
        },
      ],
    }),
    test({
      code: 'import bar from "./bar"; const {foo: foo2, baz} = bar;',
      errors: [
        {
          message:
            "Caution: `bar` also has a named export `foo`. Check if you meant to write `import {foo} from './bar'` instead.",
          type: 'Identifier',
        },
      ],
    }),
    // es2022: Arbitrary module namespace identifier names
    testVersion('>= 8.7', () => ({
      code: 'import bar from "./export-default-string-and-named"; const foo = bar.foo;',
      errors: [
        {
          message:
            "Caution: `bar` also has a named export `foo`. Check if you meant to write `import {foo} from './export-default-string-and-named'` instead.",
          type: 'MemberExpression',
        },
      ],
      parserOptions: { ecmaVersion: 2022 },
    })),
  ),
})
