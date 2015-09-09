var test = require("../utils").test

var linter = require("eslint").linter,
    RuleTester = require('eslint').RuleTester

var ruleTester = new RuleTester()
  , rule = require('../../../lib/rules/no-require')

ruleTester.run('no-require', rule, {
  valid:
    [ test({code: "var foo = require('./common');"})
    , test({code: "var fs = require('fs');"})
    , test({code: "var bar = require('./bar', true);"})
    , test({code: "var bar = proxyquire('./bar');"})
    , test({code: "var baz = require('./baz');"})
    , test({code: "var bar = require('./ba' + 'r');"})
    , test({code: "var zero = require(0);"})
    ],

  invalid:
    [ test({ code: "var bar = require('./bar');"
           , errors:
             [ { message: "CommonJS require of ES module './bar'."
               , type: "Identifier"
               }
             ]
           })
    , test({ code: "(function () { var bar = require('./bar'); }());"
           , errors:
             [ { message: "CommonJS require of ES module './bar'."
               , type: "Identifier"
               }
             ]
           })
  ]
})
