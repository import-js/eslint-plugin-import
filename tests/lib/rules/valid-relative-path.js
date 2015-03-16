"use strict";

var assign = require("object-assign");

var expect = require("chai").expect;

var path = require("path");

var linter = require("eslint").linter,
    CLIEngine = require("eslint").CLIEngine,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

function valid(c) {
  return {
    code: c,
    ecmaFeatures: { modules: true}
  };
}

function invalid(c, errors) {
  return assign(valid(c), {errors: errors});
}

eslintTester.addRuleTest("lib/rules/valid-relative-path", {
  valid: [
    valid("import foo from 'bar';")
  ],

  invalid: [
    invalid("import foo from './bar/baz'",
      [ { message: "<input>" } ])
  ]
});

describe("valid-relative-path: against actual files", function () {
  var cli = new CLIEngine({
    rulePaths: [path.resolve(process.cwd(), "lib/rules")],
    rules: { "valid-relative-path": 2 }
  });

  it("should follow relative paths.", function () {
    var report = cli.executeOnFiles([path.join(__dirname, "../../../files/foo.js")]);
    console.log(report.results[0].messages);
    expect(report.errorCount).to.equal(1);
  });
});
