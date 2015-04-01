"use strict";

var path = require("path");

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
      code: "import fs from 'fs';"}),

    test({
      code: "import { DEEP } from 'in-alternate-root';",
      settings: {"resolve.root": path.join(process.cwd(), "tests", "files", "alternate-root")}}),
    test({
      code: "import { DEEP } from 'in-alternate-root'; import { bar } from 'src-bar';",
      settings: {"resolve.root": [
        path.join(process.cwd(), "tests", "files", "src-root"),
        path.join(process.cwd(), "tests", "files", "alternate-root")
      ]}})
    ],

  invalid: [
    test({
      code: "import bar from './baz';",
      errors: [{message: "Unable to resolve path to module './baz'.", type: "Literal"}]}),
    test({
      code: "import bar from './empty-folder';",
      errors: [{message: "Unable to resolve path to module './empty-folder'.", type: "Literal"}]}),

    // sanity check that this module is _not_ found without proper settings
    test({
      code: "import { DEEP } from 'in-alternate-root';",
      errors: [{message: "Unable to resolve path to module 'in-alternate-root'.", type: "Literal"}]})
  ]
});
