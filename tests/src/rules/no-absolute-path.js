import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-absolute-path')

const error = {
  ruleId: 'no-absolute-path',
  message: 'Do not import modules using an absolute path',
}

ruleTester.run('no-absolute-path', rule, {
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
    test({
      code: 'import events from "events"',
      options: [{
        allow: ['events'],
      }],
    }),
    test({
      code: 'import path from "path"',
      options: [{
        allow: ['path'],
      }],
    }),
    test({
      code: 'var events = require("events")',
      options: [{
        allow: ['events'],
      }],
    }),
    test({
      code: 'var path = require("path")',
      options: [{
        allow: ['path'],
      }],
    }),
    test({
      code: 'import path from "path";import events from "events"',
      options: [{
        allow: ['path', 'events'],
      }],
    }),
  ],
  invalid: [
    test({
      code: 'import f from "/foo"',
      errors: [error],
    }),
    test({
      code: 'import f from "/foo/path"',
      errors: [error],
    }),
    test({
      code: 'import f from "/some/path"',
      errors: [error],
    }),
    test({
      code: 'var f = require("/foo")',
      errors: [error],
    }),
    test({
      code: 'var f = require("/foo/path")',
      errors: [error],
    }),
    test({
      code: 'var f = require("/some/path")',
      errors: [error],
    }),
  ],
})
