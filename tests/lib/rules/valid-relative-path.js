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
      [ { message: "Imported file does not exist." } ])
  ]
});

function executeOnFile(filename) {
  return this.executeOnFiles([path.join(process.cwd(), "./files", filename)]);
}

function checkErrorMessage(report, message) {
  return report.results[0].messages.some(function (result) { return result.message === message; });
}

describe("valid-relative-path: against actual files", function () {
  var cli = new CLIEngine({
    rulePaths: [path.resolve(process.cwd(), "lib/rules")],
    rules: { "valid-relative-path": 2 }
  });
  cli.executeOnFile = executeOnFile;

  it("should follow relative paths.", function () {
    var report = cli.executeOnFiles([path.join(__dirname, "../../../files/foo.js")]);
    expect(report.errorCount).to.equal(0);
  });

  it("should fail for non-existent imports.", function () {
    var report = cli.executeOnFile("bar.js");
    expect(report.errorCount).to.equal(1);
    expect(checkErrorMessage(report, "Imported file does not exist.")).to.be.true;
  });
});
