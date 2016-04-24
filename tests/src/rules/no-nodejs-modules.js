import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-nodejs-modules')

const errors = [{
  ruleId: 'no-nodejs-modules',
  message: 'Do not import Node.js builtin modules',
}]

ruleTester.run('no-nodejs-modules', rule, {
  valid: [
    test({ code: 'import _ from "lodash"'}),
    test({ code: 'import find from "lodash.find"'}),
    test({ code: 'import foo from "./foo"'}),
    test({ code: 'import foo from "../foo"'}),
    test({ code: 'import foo from "foo"'}),
    test({ code: 'import foo from "./"'}),
    test({ code: 'import foo from "@scope/foo"'}),
    test({ code: 'var _ = require("lodash")'}),
    test({ code: 'var find = require("lodash.find")'}),
    test({ code: 'var foo = require("./foo")'}),
    test({ code: 'var foo = require("../foo")'}),
    test({ code: 'var foo = require("foo")'}),
    test({ code: 'var foo = require("./")'}),
    test({ code: 'var foo = require("@scope/foo")'}),
  ],
  invalid: [
    test({
      code: 'import path from "path"',
      errors,
    }),
    test({
      code: 'import fs from "fs"',
      errors,
    }),
    test({
      code: 'var path = require("path")',
      errors,
    }),
    test({
      code: 'var fs = require("fs")',
      errors,
    }),
  ],
})
