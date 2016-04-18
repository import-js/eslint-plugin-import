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
         , errors: [ {
             line: 1,
             column: 76,
             message: 'Import in body of module; reorder to top.'
         } ],
         })
  , test({ code: "import { x } from './foo';\
                  export { x };\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: [
             {
               line: 1,
               column: 76,
               message: 'Import in body of module; reorder to top.'
             },
             {
               line: 1,
               column: 120,
               message: 'Import in body of module; reorder to top.'
             }
         ],
         })
  , test({ code: "import { x } from './foo'; import { y } from 'bar'"
         , options: ['absolute-first']
         , errors: [ {
             line: 1,
             column: 46,
             message: 'Absolute imports should come before relative imports.'
           } ],
         })
  , test({ code: "import { x } from './foo';\nimport { y } from 'bar';"
         , options: ['absolute-first', 'absolute-first-group']
         , errors: [
           {
             line: 2,
             message: 'Absolute imports should come before relative imports.'
           },
           {
              line: 2,
              message: 'There should be one empty line between ' +
                       'absolute and relative import sections.'
           }
         ],
      })
  , test({ code: "import { x } from './foo';\n\n\n\nimport { y } from 'bar';"
         , options: ['absolute-first', 'absolute-first-group']
         , errors: [
           {
             line: 5,
             message: 'Absolute imports should come before relative imports.'
           },
           {
             line: 5,
             message: 'There should be one empty line between ' +
                      'absolute and relative import sections.'
           }
         ],
      })
  ]
})
