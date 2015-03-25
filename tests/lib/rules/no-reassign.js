"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

var test = require("../../utils").test;

eslintTester.addRuleTest("lib/rules/no-reassign", {
  valid: [
    test({code: "import { foo } from './bar'; bar = 42;"}),
    test({code: "import { foo } from './bar'; function bar(foo) {};"}) // shadowing is legal
  ],

  invalid: [
    // assignment to shadow is invalid
    test({
      code: "import { foo } from './bar'; function bar(foo) { foo = 42; };",
      errors: [{ message: "Reassignment of local imported name 'foo'."}]}),

    test({
      code: "import { foo } from './bar'; foo = 42;",
      errors: [{ message: "Reassignment of local imported name 'foo'." }]}),

    test({
      code: "import foo from './bar'; foo = 42;",
      errors: [{ message: "Reassignment of local imported name 'foo'." }]}),

    test({
      code: "import * as foo from './bar'; foo = 42;",
      errors: [{ message: "Reassignment of local imported name 'foo'." }]}),

    test({
      code: "import * as foo from './bar'; foo.x = 'y';",
      errors: [{ message: "Assignment to member of namespace 'foo'."}]
    })
  ]
});
