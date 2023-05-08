import { test, testFilePath } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-parent-barrel-import');

const error = {
  message: 'Module imports from parent barrel file.',
};

ruleTester.run('no-parent-barrel-import', rule, {
  valid: [
    test({
      code: 'import _ from "lodash"',
      filename: testFilePath('./no-parent-barrel-import/index.js'),
    }),
    test({
      code: 'import baz from "./baz"',
      filename: testFilePath('./no-parent-barrel-import/foo/bar.js'),
    }),
    test({
      code: 'import bar from "./bar"',
      filename: testFilePath('./no-parent-barrel-import/foo/baz.js'),
    }),
  ],
  invalid: [
    test({
      code: 'import baz from "."',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/bar.js'),
    }),
    test({
      code: 'import baz from "../.."',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/bar.js'),
    }),
    test({
      code: 'var foo = require("./index.js")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/bar.js'),
    }),
    test({
      code: 'var foo = require(".")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/baz.js'),
    }),
    test({
      code: 'var foo = require("..")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/bar.js'),
    }),
    test({
      code: 'var foo = require("././././")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/index.js'),
    }),
    test({
      code: 'var root = require("../../..")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/foo/index.js'),
    }),
    test({
      code: 'var root = require("..")',
      errors: [error],
      filename: testFilePath('./no-parent-barrel-import/index.js'),
    }),

  ],
});
