import { test } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-useless-path-segments')

function runResolverTests(resolver) {
  ruleTester.run(`no-useless-path-segments (${resolver})`, rule, {
    valid: [
      // commonjs with default options
      test({ code: 'require("./../files/malformed.js")' }),

      // esmodule
      test({ code: 'import "./malformed.js"' }),
      test({ code: 'import "./test-module"' }),
      test({ code: 'import "./bar/"' }),
      test({ code: 'import "."' }),
      test({ code: 'import ".."' }),
      test({ code: 'import fs from "fs"' }),
    ],

    invalid: [
      // commonjs
      test({
        code: 'require("./../files/malformed.js")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./../files/malformed.js", should be "../files/malformed.js"'],
      }),
      test({
        code: 'require("./../files/malformed")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./../files/malformed", should be "../files/malformed"'],
      }),
      test({
        code: 'require("../files/malformed.js")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../files/malformed.js", should be "./malformed.js"'],
      }),
      test({
        code: 'require("../files/malformed")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../files/malformed", should be "./malformed"'],
      }),
      test({
        code: 'require("./test-module/")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./test-module/", should be "./test-module"'],
      }),
      test({
        code: 'require("./")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./", should be "."'],
      }),
      test({
        code: 'require("../")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../", should be ".."'],
      }),
      test({
        code: 'require("./deep//a")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
      }),

      // esmodule
      test({
        code: 'import "./../files/malformed.js"',
        errors: [ 'Useless path segments for "./../files/malformed.js", should be "../files/malformed.js"'],
      }),
      test({
        code: 'import "./../files/malformed"',
        errors: [ 'Useless path segments for "./../files/malformed", should be "../files/malformed"'],
      }),
      test({
        code: 'import "../files/malformed.js"',
        errors: [ 'Useless path segments for "../files/malformed.js", should be "./malformed.js"'],
      }),
      test({
        code: 'import "../files/malformed"',
        errors: [ 'Useless path segments for "../files/malformed", should be "./malformed"'],
      }),
      test({
        code: 'import "./test-module/"',
        errors: [ 'Useless path segments for "./test-module/", should be "./test-module"'],
      }),
      test({
        code: 'import "./"',
        errors: [ 'Useless path segments for "./", should be "."'],
      }),
      test({
        code: 'import "../"',
        errors: [ 'Useless path segments for "../", should be ".."'],
      }),
      test({
        code: 'import "./deep//a"',
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
      }),
     ],
   })
}

['node', 'webpack'].forEach(runResolverTests)
