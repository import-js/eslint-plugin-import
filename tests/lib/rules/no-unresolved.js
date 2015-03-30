"use strict";

var test = require("../../utils").test;

var linter = require("eslint").linter,
    ESLintTester = require("eslint-tester");

var eslintTester = new ESLintTester(linter);

eslintTester.addRuleTest("lib/rules/no-unresolved", {
  valid: [
    test({
      code: "import foo from './bar';"}),
    test({
      code: "import bar from './bar.js';"}),
    test({
      code: "import {someThing} from './module';"}),
    test({
      code: "import fs from 'fs';"})
    ],

  invalid: [
    test({
      code: "import bar from './baz';",
      errors: [{message: "Unable to resolve path to module './baz'.", type: "Literal"}]}),
    test({
      code: "import bar from './empty-folder';",
      errors: [{message: "Unable to resolve path to module './empty-folder'.", type: "Literal"}]})
  ]
});
