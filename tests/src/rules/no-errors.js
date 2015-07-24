"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

var test = require("../../utils").test;

eslintTester.addRuleTest("src/rules/no-errors", {
  valid: [
    test({code: "import { foo } from './bar';"}),
    test({code: "import { foo } from './empty-folder';"}),
    test({code: "import { foo } from './does-not-exist';"}),
    test({code: "import { a } from './test'"})

  , test({ code: "import Foo from './jsx/FooES7.js';", args: [0] })
  ],

  invalid: [
    test({ code: "import Foo from './jsx/FooES7.js';",
      errors: [{
        message: "Errors encountered while analysing imported module './jsx/FooES7.js'.",
        type: "Literal"}]}),


    test({code: "import { a } from './test.coffee';",
      errors: [{
        message: "Errors encountered while analysing imported module './test.coffee'.",
        type: "Literal"}]}),

    test({code: "import foo from './malformed.js'",
      errors: [{
        message: "Errors encountered while analysing imported module './malformed.js'.",
        type: "Literal"}]}),
    test({code: "import foo from './malformed.js'",
      args: [2, "include-messages"],
      errors: [{type: "Literal"}]}),
    test({code: "import foo from './malformed.js'",
      args: [2, "include-stack"],
      errors: [{type: "Literal"}]})
  ]
});
