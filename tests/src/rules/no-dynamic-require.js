import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-dynamic-require')

const error = {
  ruleId: 'no-dynamic-require',
  message: 'Calls to require() should use string literals',
}

ruleTester.run('no-dynamic-require', rule, {
  valid: [
    test({ code: 'import _ from "lodash"'}),
    test({ code: 'require("foo")'}),
    test({ code: 'require(`foo`)'}),
    test({ code: 'require("./foo")'}),
    test({ code: 'require("@scope/foo")'}),
    test({ code: 'require()'}),
    test({ code: 'require("./foo", "bar" + "okay")'}),
    test({ code: 'var foo = require("foo")'}),
    test({ code: 'var foo = require(`foo`)'}),
    test({ code: 'var foo = require("./foo")'}),
    test({ code: 'var foo = require("@scope/foo")'}),
  ],
  invalid: [
    test({
      code: 'require("../" + name)',
      errors: [error],
    }),
    test({
      code: 'require(`../${name}`)',
      errors: [error],
    }),
    test({
      code: 'require(name)',
      errors: [error],
    }),
    test({
      code: 'require(name())',
      errors: [error],
    }),
    test({
      code: 'require(name + "foo", "bar")',
      errors: [error],
    }),
  ],
})
