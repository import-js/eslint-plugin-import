"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

var test = require("../../utils").test;

eslintTester.addRuleTest("lib/rules/no-errors", {
  valid: [
    test({code: "import { foo } from './bar';"}),
    test({code: "import { foo } from './empty-folder';"}),
    test({code: "import { foo } from './does-not-exist';"}),
    test({code: "import { a } from './test'"})
  ],

  invalid: [
    test({code: "import fs from 'fs';",
      errors: [{
        message: "Errors encountered while analysing imported module 'fs'.",
        type: "Literal"}]}),
    test({code: "import fs from 'fs';",
      args: [1, "include-messages"],
      errors: [{
        message: "Errors encountered while analysing imported module \'fs\'.\n" +
                 "Error: ENOENT, no such file or directory \'fs\'",
        type: "Literal"}]}),
    test({code: "import { a } from './test.coffee';",
      errors: [{
        message: "Errors encountered while analysing imported module './test.coffee'.",
        type: "Literal"}]}),
    test({code: "import foo from './malformed.js'",
      errors: [{
        message: "Errors encountered while analysing imported module './malformed.js'.",
        type: "Literal"}]})
  ]
});
