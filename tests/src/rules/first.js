import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/first')

ruleTester.run('first', rule, {
  valid: [
    test({ code: "import { x } from './foo'; import { y } from './bar';\
                  export { x, y }" })
  , test({ code: "import { x } from 'foo'; import { y } from './bar'" })
  , test({ code: "import { x } from './foo'; import { y } from 'bar'" })
  , test({ code: "'use directive';\
                  import { x } from 'foo';" })
  ,
  ],
  invalid: [
    test({ code: "import { x } from './foo';\
                  export { x };\
                  import { y } from './foo';"
         , errors: 1
         , output: "import { x } from './foo';\
                  import { y } from './foo';\
                  export { x };"
         })
  , test({ code: "import { x } from './foo';\
                  export { x };\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: 2
         , output: "import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';\
                  export { x };"
         })
  , test({ code: "import { x } from './foo'; import { y } from 'bar'"
         , options: ['absolute-first']
         , errors: 1
         })
  , test({ code: "import { x } from 'foo';\
                  'use directive';\
                  import { y } from 'bar';"
         , errors: 1
         , output: "import { x } from 'foo';\
                  import { y } from 'bar';\
                  'use directive';"
         })
  , test({ code: "var foo = bar;\
                  import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: 3
         , output: "import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';\nvar foo = bar;"
  })
  , test({ code: "var a = x;\
                  import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: 2
         , output: "import { y } from './bar';\
                  import { z } from './baz';\nvar a = x;\
                  import { x } from './foo';"
  })
  , test({ code: "if (true) { x() };\
                  import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';"
         , errors: 3
         , output: "import { x } from './foo';\
                  import { y } from './bar';\
                  import { z } from './baz';\nif (true) { x() };"
  })
  ,
  ]
})
