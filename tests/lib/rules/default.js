"use strict";

var
  assign = require("object-assign"),
  path = require("path");

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);


var ecmaFeatures = {ecmaFeatures: { modules: true }};

var ERRORS = [{message: "No default export found in module.", type: "ImportDefaultSpecifier"}];
var FILENAME = path.join(process.cwd(), "./files", "foo.js");

eslintTester.addRuleTest("lib/rules/default", {
  valid: [
    assign({
      code: "import foo from './default-export';",
      filename: FILENAME
    }, ecmaFeatures),

    assign({
      code: "import bar from './default-export';",
      filename: FILENAME
    }, ecmaFeatures),

    assign({
      code: "import CoolClass from './default-class';",
      filename: FILENAME
    }, ecmaFeatures),

    assign({
      code: "import bar, { baz } from './default-export';",
      filename: FILENAME
    }, ecmaFeatures),

    assign({
      code: "import bar from './common';",
      filename: FILENAME
    }, ecmaFeatures)
  ],

  invalid: [
    assign({
      code: "import baz from './named-exports';",
      filename: FILENAME,
      errors: ERRORS
    }, ecmaFeatures),

    assign({
      code: "import bar from './common';",
      args: [2, "es6-only"],
      filename: FILENAME,
      errors: ERRORS
    }, ecmaFeatures)
  ]
});
