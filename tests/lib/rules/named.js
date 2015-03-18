"use strict";

var assign = require("object-assign");
var path = require("path");

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);


var ecmaFeatures = {ecmaFeatures: { modules: true}};

function filename(f) {
  return path.join(process.cwd(), "./files", f);
}

var ERRORS = [{message: "Name not found in module.", type: "Identifier"}];

eslintTester.addRuleTest("lib/rules/named", {
  valid: [
    assign({
      code: "import { foo } from './bar';",
      filename: filename("foo.js")
    }, ecmaFeatures),
    assign({
      code: "import bar from './bar.js';",
      args: [1, [""]],
      filename: filename("foo.js")
    }, ecmaFeatures)
  ],

  invalid: [
    // assign({
    //   code: "import foo from './bar';",
    //   filename: filename("foo.js"),
    //   errors: ERRORS
    // }, ecmaFeatures),
    assign({
      code: "import { baz } from './bar';",
      filename: filename("foo.js"),
      errors: ERRORS
    }, ecmaFeatures),

    // test multiple
    assign({
      code: "import { baz, bop } from './bar';",
      filename: filename("foo.js"),
      errors: ERRORS.concat(ERRORS)
    }, ecmaFeatures)
  ]
});
