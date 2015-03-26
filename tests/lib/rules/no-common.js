"use strict";

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

var test = require("../../utils").test;

eslintTester.addRuleTest("lib/rules/no-common", {
  valid: [
    test({code: "import { foo } from './bar';"}),
    test({code: "import foo from './empty-folder';"})
  ],

  invalid: [
    test({code: "import { a } from './common';",
      errors: [{ message: "'./common' is a CommonJS module."}]}),
    test({code: "import { a } from './export-props';",
      errors: [{ message: "'./export-props' is a CommonJS module."}]}),
    test({code: "import { foobar } from './exports-calc-keys';",
      errors: [{ message: "'./exports-calc-keys' is a CommonJS module."}]}),

    test({code: "import {x} from './nested-common';",
      errors: [{ message: "'./nested-common' is a CommonJS module."}]}),

    test({code: "import {x} from './umd';",
      errors: [{ message: "'./umd' is a CommonJS module."}]})
  ]
});
