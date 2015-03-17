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

eslintTester.addRuleTest("lib/rules/valid-relative-path", {
  valid: [
    assign({
      code: "import * as foo from 'bar';" // not relative
    }, ecmaFeatures),
    assign({
      code: "import foo from './bar';",
      filename: filename("foo.js")
    }, ecmaFeatures),
    assign({
      code: "import bar from './bar.js';",
      args: [1, [""]],
      filename: filename("foo.js"),
      errors: [{message: "Imported file does not exist."}]
    }, ecmaFeatures)
  ],

  invalid: [
    assign({
      code: "import bar from './bar.js';",
      filename: filename("foo.js"),
      errors: [{message: "Imported file does not exist."}]
    }, ecmaFeatures),
    assign({
      code: "import bar from './baz';",
      filename: filename("foo.js"),
      errors: [{message: "Imported file does not exist."}]
    }, ecmaFeatures)
  ]
});
