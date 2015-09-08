import { test } from '../../utils'

import { linter, RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('../../../src/rules/no-duplicates')

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: "import { x } from './foo'; import { y } from './bar'" })
  ],
  invalid: [
    test({ code: "import { x } from './foo'; import { y } from './foo'"
         , errors: 2
         })
  , test({ code: "import { x } from './foo';\
                  import { y } from './foo';\
                  import { z } from './foo'"
         , errors: 3
         })
  ]
})
