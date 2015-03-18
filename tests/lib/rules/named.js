"use strict";

var assign = require("object-assign");
var path = require("path");

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);


var ecmaFeatures = {ecmaFeatures: { modules: true }};

function filename(f) {
  return path.join(process.cwd(), "./files", f);
}

var ERRORS = [{message: "Name not found in module.", type: "Identifier"}];
var FILENAME = filename("foo.js");

eslintTester.addRuleTest("lib/rules/named", {
  valid: [
    assign({
      code: "import { foo } from './bar';",
      filename: filename("foo.js")
    }, ecmaFeatures),
    assign({
      code: "import bar from './bar.js';",
      settings: { "import/extensions": [".js"] },
      filename: FILENAME
    }, ecmaFeatures),
    assign({
      code: "import {a, b, d} from './named-exports';",
      filename: FILENAME
    }, ecmaFeatures),

    assign({
      code: "import {a, b, d} from './common';",
      filename: FILENAME
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
    }, ecmaFeatures),

    assign({
      code: "import {a, b, c} from './named-exports';",
      filename: FILENAME,
      errors: ERRORS
    }, ecmaFeatures),

    assign({
      code: "import { a } from './common';",
      args: [2, "es6"],
      filename: FILENAME,
      errors: ERRORS
    }, ecmaFeatures)
  ]
});
