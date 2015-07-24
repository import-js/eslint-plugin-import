"use strict";

var test = require("../../utils").test;

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest("src/rules/no-require",
{ valid:
  [ test({code: "var foo = require('./common');"})
  , test({code: "var fs = require('fs');"})
  , test({code: "var bar = require('./bar', true);"})
  , test({code: "var bar = proxyquire('./bar');"})
  , test({code: "var baz = require('./baz');"})
  , test({code: "var bar = require('./ba' + 'r');"})
  , test({code: "var zero = require(0);"})
  ]
, invalid:
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
});
