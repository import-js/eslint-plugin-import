import { test } from '../../utils'

import { linter, RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('../../../src/rules/export')

ruleTester.run('export', rule, {
  valid: [
    // default
    test({ code: 'var foo = "foo"; export default foo;' })
  , test({ code: 'export var foo = "foo"; export var bar = "bar";'})
  , test({ code: 'export { foo, foo as bar }' })
  , test({ code: 'export { bar }; export * from "./export-all"' })
  , test({ code: 'export * from "./export-all"' })
  , test({ code: 'export * from "./does-not-exist"' })
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
  , test({ code: 'export * from "./default-export"'
         , errors: [ { message: 'No named exports found in module ' +
                                '\'./default-export\'.'
                     , type: 'Literal'
                     } ]
         })

  ]
})
