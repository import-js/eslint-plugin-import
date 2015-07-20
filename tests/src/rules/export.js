import { test } from '../../utils'

import { linter } from 'eslint'
import ESLintTester from 'eslint-tester'

const eslintTester = new ESLintTester(linter)

eslintTester.addRuleTest('lib/rules/export', {
  valid: [
    // default
    test({ code: 'var foo = "foo"; export default foo;' })
  , test({ code: 'export var foo = "foo"; export var bar = "bar";'})
  , test({ code: 'export { foo, foo as bar }' })
  , test({ code: 'export { bar }; export * from "./export-all"' })
  ],

  invalid: [
    // multiple defaults
    test({ code: 'export default foo; export default bar'
         , errors: 2
         })
  , test({ code: 'export default function foo() {}; ' +
                 'export default function bar() {}'
         , errors: 2
         })
  , test({ code: 'export function foo() {}; ' +
                 'export { bar as foo }'
         , errors: 2
         })
  , test({ code: 'export {foo}; export {foo};'
         , errors: 2
         })
  , test({ code: 'export {foo}; export {bar as foo};'
         , errors: 2
         })
  , test({ code: 'export var foo = "foo"; export var foo = "bar";'
         , errors: 2
         })
  , test({ code: 'export var foo = "foo", foo = "bar";'
         , errors: 2
         })
  , test({ code: 'export { foo }; export * from "./export-all"'
         , errors: 2
         })
  ]
})
