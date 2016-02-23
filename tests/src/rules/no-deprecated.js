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

    // naked namespace is fine
    test({ code: "import * as depd from './deprecated'" }),
  ],
  invalid: [

    test({
      code: "import { fn } from './deprecated'",
      errors: ["Deprecated: please use 'x' instead."],
    }),

    test({
      code: "import TerribleClass from './deprecated'",
      errors: ['Deprecated: this is awful, use NotAsBadClass.'],
    }),

    test({
      code: "import { MY_TERRIBLE_ACTION } from './deprecated'",
      errors: ['Deprecated: please stop sending/handling this action type.'],
    }),

    // ignore redeclares
    test({
      code: "import { MY_TERRIBLE_ACTION } from './deprecated'; function shadow(MY_TERRIBLE_ACTION) { console.log(MY_TERRIBLE_ACTION); }",
      errors: ['Deprecated: please stop sending/handling this action type.'],
    }),

    // ignore non-deprecateds
    test({
      code: "import { MY_TERRIBLE_ACTION, fine } from './deprecated'; console.log(fine)",
      errors: ['Deprecated: please stop sending/handling this action type.'],
    }),

    // reflag on subsequent usages
    test({
      code: "import { MY_TERRIBLE_ACTION } from './deprecated'; console.log(MY_TERRIBLE_ACTION)",
      errors: [
        { type: 'ImportSpecifier', message: 'Deprecated: please stop sending/handling this action type.' },
        { type: 'Identifier', message: 'Deprecated: please stop sending/handling this action type.' },
      ],
    }),

    // works for function calls too
    test({
      code: "import { MY_TERRIBLE_ACTION } from './deprecated'; console.log(MY_TERRIBLE_ACTION(this, is, the, worst))",
      errors: [
        { type: 'ImportSpecifier', message: 'Deprecated: please stop sending/handling this action type.' },
        { type: 'Identifier', message: 'Deprecated: please stop sending/handling this action type.' },
      ],
    }),

    // deprecated full module
    test({
      code: "import Thing from './deprecated-file'",
      errors: [
        { type: 'ImportDeclaration', message: 'Deprecated: this module is the worst.' },
      ],
    }),
  ],
})
