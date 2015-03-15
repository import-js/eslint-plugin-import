"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester"),
    eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest("lib/rules/test-import-visitor", {
  valid: [
    "var validVariable = true;",
  ],

  invalid: [
    {
      code: "import foo from 'bar'",
      ecmaFeatures: { modules: true },
      errors: [ { message: "This is an import!" } ]
    }
  ]
});