import { test } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('../../../lib/rules/no-require')

ruleTester.run('no-require', rule, {
  valid:
    [ test({ code: "var bar = require('./bar', true);" })
    , test({ code: "var bar = proxyquire('./bar');" })
    , test({ code: "var bar = require('./ba' + 'r');" })
    , test({ code: 'var zero = require(0);' })
    ],

  invalid:
    [ test({ code: "var foo = require('./common');"
           , errors: 1 })
      // future: maybe a rule option that doesn't report on anything
      //         but top-level scoped requires?
    , test({ code: 'function () { var bar = require("./bar"); }'
           , errors: 1 })
    , test({ code: 'var bar = require("./bar")'
           , settings: { 'import/ignore': ['bar'] }
           , errors: 1 })
    , test({ code: "var bar = require('./bar');"
           , errors:
             [ { message: "CommonJS require of module './bar'."
               , type: 'Identifier'
               }
             ]
           })
    , test({ code: "(function () { var bar = require('./bar'); }());"
           , errors:
             [ { message: "CommonJS require of module './bar'."
               , type: 'Identifier'
               }
             ]
           })
      // enforce no-require on system modules
    , test({ code: "var fs = require('fs');"
           , errors: 1
           })
      // will be enforced on modules not resolved, too
    , test({ code: "var baz = require('./missing-module');"
           , errors: 1
           })
  ]
})
