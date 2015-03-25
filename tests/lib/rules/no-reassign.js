"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

var test = require("../../utils").test;

eslintTester.addRuleTest("lib/rules/no-reassign", {
  valid: [
    test({code: "import { foo } from './bar'; bar = 42;"}),
    // may assign to imported names' members
    test({code: "import { foo } from './bar'; foo.x = 42; "}),
    // may assign to imported namespaces' names' members
    test({code: "import * as foo from './bar'; foo.x.y = 42; "})
  ],

  invalid: [
    // assignment to shadow is invalid
    test({
      code: "import { foo } from './bar'; function bar(foo) { };",
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
      code: "import { foo } from './bar';\nfunction foo() { return false; }",
      errors: [{ message: "Reassignment of local imported name 'foo'." }]}),

    test({
      code: "import { foo } from './bar';\nvar bar = 32, foo = function() { return false; }",
      errors: [{ message: "Reassignment of local imported name 'foo'." }]}),

    test({
      code: "import * as foo from './bar'; foo.x = 'y';",
      errors: [{ message: "Assignment to member of namespace 'foo'."}]
    })
  ]
});
