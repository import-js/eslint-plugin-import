import * as path from 'path'
import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-deprecated')

ruleTester.run('no-deprecated', rule, {
  valid: [
    test({ code: "import { x } from './fake' " }),
    test({ code: "import bar from './bar'" }),

    test({ code: "import { fine } from './deprecated'" }),
    test({ code: "import { _undocumented } from './deprecated'" }),
  ],
  invalid: [
    test({
      code: "import { fn } from './deprecated'",
      errors: ["Deprecated: please use 'x' instead."],
    }),
    test({
      code: "import TerribleClass from './deprecated'",
      errors: ["Deprecated: this is awful, use NotAsBadClass."],
    }),
  ],
})
