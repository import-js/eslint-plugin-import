import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-absolute-path')

const error = {
  message: 'Do not import modules using an absolute path',
}

ruleTester.run('no-absolute-path', rule, {
  valid: [
    test({ code: 'import _ from "lodash"' }),
    test({ code: 'import find from "lodash.find"' }),
    test({ code: 'import foo from "./foo"' }),
    test({ code: 'import foo from "../foo"' }),
    test({ code: 'import foo from "foo"' }),
    test({ code: 'import foo from "./"' }),
    test({ code: 'import foo from "@scope/foo"' }),
    test({ code: 'var _ = require("lodash")' }),
    test({ code: 'var find = require("lodash.find")' }),
    test({ code: 'var foo = require("./foo")' }),
    test({ code: 'var foo = require("../foo")' }),
    test({ code: 'var foo = require("foo")' }),
    test({ code: 'var foo = require("./")' }),
    test({ code: 'var foo = require("@scope/foo")' }),

    test({ code: 'import events from "events"' }),
    test({ code: 'import path from "path"' }),
    test({ code: 'var events = require("events")' }),
    test({ code: 'var path = require("path")' }),
    test({ code: 'import path from "path";import events from "events"' }),

    // still works if only `amd: true` is provided
    test({
      code: 'import path from "path"',
      options: [{ amd: true }],
    }),

    // amd not enabled by default
    test({ code: 'require(["/some/path"], function (f) { /* ... */ })' }),
    test({ code: 'define(["/some/path"], function (f) { /* ... */ })' }),
    test({
      code: 'require(["./some/path"], function (f) { /* ... */ })',
      options: [{ amd: true }],
    }),
    test({
      code: 'define(["./some/path"], function (f) { /* ... */ })',
      options: [{ amd: true }],
    }),
  ],
  invalid: [
    test({
      code: 'import f from "/foo"',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'import f from ".."',
    }),
    test({
      code: 'import f from "/foo/bar/baz.js"',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'import f from "./baz.js"',
    }),
    test({
      code: 'import f from "/foo/path"',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'import f from "../path"',
    }),
    test({
      code: 'import f from "/some/path"',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'import f from "../../some/path"',
    }),
    test({
      code: 'import f from "/some/path"',
      filename: '/foo/bar/index.js',
      options: [{ amd: true }],
      errors: [error],
      output: 'import f from "../../some/path"',
    }),
    test({
      code: 'var f = require("/foo")',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'var f = require("..")',
    }),
    test({
      code: 'var f = require("/foo/path")',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'var f = require("../path")',
    }),
    test({
      code: 'var f = require("/some/path")',
      filename: '/foo/bar/index.js',
      errors: [error],
      output: 'var f = require("../../some/path")',
    }),
    test({
      code: 'var f = require("/some/path")',
      filename: '/foo/bar/index.js',
      options: [{ amd: true }],
      errors: [error],
      output: 'var f = require("../../some/path")',
    }),
    // validate amd
    test({
      code: 'require(["/some/path"], function (f) { /* ... */ })',
      filename: '/foo/bar/index.js',
      options: [{ amd: true }],
      errors: [error],
      output: 'require(["../../some/path"], function (f) { /* ... */ })',
    }),
    test({
      code: 'define(["/some/path"], function (f) { /* ... */ })',
      filename: '/foo/bar/index.js',
      options: [{ amd: true }],
      errors: [error],
      output: 'define(["../../some/path"], function (f) { /* ... */ })',
    }),
  ],
})
