import * as path from 'path'
import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('../../../lib/rules/no-duplicates')

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: "import { x } from './foo'; import { y } from './bar'" }),

    // #86: every unresolved module should not show up as 'null' and duplicate
    test({ code: 'import foo from "234artaf";' +
                 'import { shoop } from "234q25ad"' }),
  ],
  invalid: [
    test({
      code: "import { x } from './foo'; import { y } from './foo'",
      errors: 2,
    }),

    test({
      code: "import { x } from './foo';\
             import { y } from './foo';\
             import { z } from './foo'",
      errors: 3,
    }),

    // ensure resolved path results in warnings
    test({
      code: "import { x } from './bar';\
             import { y } from 'bar';",
      settings: { 'import/resolve': {
        paths: [path.join( process.cwd()
                         , 'tests', 'files'
                         )] }},
      errors: 2,
     }),

    // #86: duplicate unresolved modules should be flagged
    test({
      code: "import foo from 'non-existent'; import bar from 'non-existent';",
      errors: [
        "Module 'non-existent' imported multiple times.",
        "Module 'non-existent' imported multiple times.",
      ],
    }),
  ],
})
