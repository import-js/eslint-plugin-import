var path = require('path')

import { test } from '../utils'

import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('../../../lib/rules/no-unresolved')

ruleTester.run('no-unresolved', rule, {
  valid: [
    test({ code: 'import foo from "./bar";' }),
    test({ code: "import bar from './bar.js';" }),
    test({ code: "import {someThing} from './module';" }),
    test({ code: "import fs from 'fs';" }),

    test({
      code: "import { DEEP } from 'in-alternate-root';",
      settings: {
        'import/resolve': {
          'paths': [path.join( process.cwd()
                             , 'tests', 'files', 'alternate-root')],
        },
      },
    }),
    test({
      code: "import { DEEP } from 'in-alternate-root'; " +
            "import { bar } from 'src-bar';",
      settings: {'import/resolve': { 'paths': [
        path.join('tests', 'files', 'src-root'),
        path.join('tests', 'files', 'alternate-root'),
      ]}}}),

    test({ code: 'import * as foo from "a"' }),

    test({
      code: 'import * as foo from "jsx-module/foo"',
      settings: { 'import/resolve': { 'extensions': ['.jsx'] } },
    }),

    test({ code: 'export { foo } from "./bar"' }),
    test({ code: 'export * from "./bar"' }),
    test({ code: 'export { foo }' }),

    // stage 1 proposal for export symmetry,
    test({ code: 'export * as bar from "./bar"'
         , parser: 'babel-eslint' }),
    test({ code: 'export bar from "./bar"'
         , parser: 'babel-eslint' }),
    test({ code: 'import foo from "./jsx/MyUnCoolComponent.jsx"' }),

    // commonjs setting
    test({ code: 'var foo = require("./bar")'
         , options: [{ commonjs: true }]}),
    test({ code: 'require("./bar")'
         , options: [{ commonjs: true }]}),
    test({ code: 'require("./does-not-exist")'
         , options: [{ commonjs: false }]}),
    test({ code: 'require("./does-not-exist")' }),

    // amd setting
    test({ code: 'require(["./bar"], function (bar) {})'
         , options: [{ amd: true }]}),
    test({ code: 'define(["./bar"], function (bar) {})'
         , options: [{ amd: true }]}),
    test({ code: 'require(["./does-not-exist"], function (bar) {})'
         , options: [{ amd: false }]}),
    // don't validate without callback param
    test({ code: 'require(["./does-not-exist"])'
         , options: [{ amd: true }]}),
    test({ code: 'define(["./does-not-exist"], function (bar) {})' }),

    // stress tests
    test({ code: 'require("./does-not-exist", "another arg")'
         , options: [{ commonjs: true, amd: true }]}),
    test({ code: 'proxyquire("./does-not-exist")'
         , options: [{ commonjs: true, amd: true }]}),
    test({ code: '(function() {})("./does-not-exist")'
         , options: [{ commonjs: true, amd: true }]}),
    test({ code: 'define([0, foo], function (bar) {})'
         , options: [{ amd: true }]}),
    test({ code: 'require(0)'
         , options: [{ commonjs: true }]}),
    test({ code: 'require(foo)'
         , options: [{ commonjs: true }]}),

  ],

  invalid: [
    // should fail for jsx by default
    test({
      code: 'import * as foo from "jsx-module/foo"',
      errors: [ {message: 'Unable to resolve path to ' +
                          'module \'jsx-module/foo\'.'} ],
    }),


    test({
      code: 'import reallyfake from "./reallyfake/module"',
      settings: { 'import/ignore': ['^\\./fake/'] },
      errors: [{ message: 'Unable to resolve path to module ' +
                          '\'./reallyfake/module\'.' }],
    }),


    test({
      code: "import bar from './baz';",
      errors: [{ message: "Unable to resolve path to module './baz'."
               , type: 'Literal' }],
    }),
    test({ code: "import bar from './baz';"
         , errors: [{ message: "Unable to resolve path to module './baz'."
                    , type: 'Literal',
                    }] }),
    test({
      code: "import bar from './empty-folder';",
      errors: [{ message: "Unable to resolve path to module './empty-folder'."
               , type: 'Literal',
               }]}),

    // sanity check that this module is _not_ found without proper settings
    test({
      code: "import { DEEP } from 'in-alternate-root';",
      errors: [{ message: 'Unable to resolve path to ' +
                          "module 'in-alternate-root'."
               , type: 'Literal',
               }]}),

    test({ code: 'export { foo } from "./does-not-exist"'
         , errors: 1 }),
    test({
      code: 'export * from "./does-not-exist"',
      errors: 1,
    }),

    // export symmetry proposal
    test({ code: 'export * as bar from "./does-not-exist"'
         , parser: 'babel-eslint'
         , errors: 1,
         }),
    test({ code: 'export bar from "./does-not-exist"'
         , parser: 'babel-eslint'
         , errors: 1,
         }),

    test({ code: 'import foo from "./jsx/MyUncoolComponent.jsx"'
         , errors: 1 }),


    // commonjs setting
    test({
      code: 'var bar = require("./baz")',
      options: [{ commonjs: true }],
      errors: [{
        message: "Unable to resolve path to module './baz'.",
        type: 'Literal',
      }],
    }),
    test({
      code: 'require("./baz")',
      options: [{ commonjs: true }],
      errors: [{
        message: "Unable to resolve path to module './baz'.",
        type: 'Literal',
      }],
    }),

    // amd
    test({
      code: 'require(["./baz"], function (bar) {})',
      options: [{ amd: true }],
      errors: [{
        message: "Unable to resolve path to module './baz'.",
        type: 'Literal',
      }],
    }),
    test({
      code: 'define(["./baz"], function (bar) {})',
      options: [{ amd: true }],
      errors: [{
        message: "Unable to resolve path to module './baz'.",
        type: 'Literal',
      }],
    }),
    test({
      code: 'define(["./baz", "./bar", "./does-not-exist"], function (bar) {})',
      options: [{ amd: true }],
      errors: [{
        message: "Unable to resolve path to module './baz'.",
        type: 'Literal',
      },{
        message: "Unable to resolve path to module './does-not-exist'.",
        type: 'Literal',
      }],
    }),
  ],
})
