import { test, testFilePath } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-self-import')

const error = {
  message: 'Module imports itself.',
}

ruleTester.run('no-self-import', rule, {
  valid: [
    test({
      code: 'import _ from "lodash"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import find from "lodash.find"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import foo from "./foo"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import foo from "../foo"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import foo from "foo"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import foo from "./"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'import foo from "@scope/foo"',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var _ = require("lodash")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var find = require("lodash.find")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var foo = require("./foo")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var foo = require("../foo")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var foo = require("foo")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var foo = require("./")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var foo = require("@scope/foo")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var bar = require("./bar/index")',
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var bar = require("./bar")',
      filename: testFilePath('./bar/index.js'),
    }),
    test({
      code: 'var bar = require("./bar")',
      filename: '<text>',
    }),
  ],
  invalid: [
    test({
      code: 'import bar from "./no-self-import"',
      errors: [error],
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var bar = require("./no-self-import")',
      errors: [error],
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var bar = require("./no-self-import.js")',
      errors: [error],
      filename: testFilePath('./no-self-import.js'),
    }),
    test({
      code: 'var bar = require(".")',
      errors: [error],
      filename: testFilePath('./index.js'),
    }),
    test({
      code: 'var bar = require("./")',
      errors: [error],
      filename: testFilePath('./index.js'),
    }),
    test({
      code: 'var bar = require("././././")',
      errors: [error],
      filename: testFilePath('./index.js'),
    }),
    test({
      code: 'var bar = require("../no-self-import-folder")',
      errors: [error],
      filename: testFilePath('./no-self-import-folder/index.js'),
    }),
  ],
})
