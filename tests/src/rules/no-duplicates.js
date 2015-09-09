import * as path from 'path'
import { test } from '../utils'

import { linter, RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('../../../lib/rules/no-duplicates')

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

  // ensure resolved path results in warnings
  , test({ code: "import { x } from './bar';\
                  import { y } from 'bar';"
         , settings: { 'import/resolve': {
             paths: [path.join( process.cwd()
                              , 'tests', 'files'
                              )] }}
         , errors: 2
         })
  ]
})
