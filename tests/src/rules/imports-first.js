import { test } from '../utils'

import { linter, RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/imports-first')

ruleTester.run('imports-first', rule, {
  valid: [
    test({ code: "import { x } from './foo'; import { y } from './bar';\
                  export { x, y }" })
  , test({ code: "import { x } from 'foo'; import { y } from './bar'" })
  , test({ code: "import { x } from './foo'; import { y } from 'bar'" })
  ],
  invalid: [
    test({ code: "import { x } from './foo';\
                  export { x };\
                  import { y } from './foo';"
         , errors: 1
         })
  , test({ code: "import { x } from './foo';\
                  export { x };\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: 2
         })
  , test({ code: "import { x } from './foo'; import { y } from 'bar'"
         , options: ['absolute-first']
         , errors: 1
         })
  ]
})
