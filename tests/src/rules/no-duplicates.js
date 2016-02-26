import * as path from 'path'
import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-duplicates')

ruleTester.run('no-duplicates', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: "import { x } from './foo'; import { y } from './bar'" }),

    // #86: every unresolved module should not show up as 'null' and duplicate
    test({ code: 'import foo from "234artaf";' +
                 'import { shoop } from "234q25ad"' }),
  ],
  invalid: [
    test({
      code: "import { x } from './foo'; import { y } from './foo'",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    test({
      code: "import { x } from './foo'; import { y } from './foo'; import { z } from './foo'",
      errors: ['\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.', '\'./foo\' imported multiple times.'],
    }),

    // ensure resolved path results in warnings
    test({
      code: "import { x } from './bar'; import { y } from 'bar';",
      settings: { 'import/resolve': {
        paths: [path.join( process.cwd()
                         , 'tests', 'files'
                         )] }},
      errors: 2, // path ends up hardcoded
     }),

    // #86: duplicate unresolved modules should be flagged
    test({
      code: "import foo from 'non-existent'; import bar from 'non-existent';",
      errors: [
        "'non-existent' imported multiple times.",
        "'non-existent' imported multiple times.",
      ],
    }),
  ],
})
