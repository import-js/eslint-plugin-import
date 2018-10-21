import { test } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-useless-path-segments')

function runResolverTests(resolver) {
  ruleTester.run(`no-useless-path-segments (${resolver})`, rule, {
    valid: [
      // CommonJS modules with default options
      test({ code: 'require("./../files/malformed.js")' }),

      // ES modules with default options
      test({ code: 'import "./malformed.js"' }),
      test({ code: 'import "./test-module"' }),
      test({ code: 'import "./bar/"' }),
      test({ code: 'import "."' }),
      test({ code: 'import ".."' }),
      test({ code: 'import fs from "fs"' }),

      // ES modules + noUselessIndex
      test({ code: 'import "../index"' }), // noUselessIndex is false by default
      test({ code: 'import "../my-custom-index"', options: [{ noUselessIndex: true }] }),
      test({ code: 'import "./bar.js"', options: [{ noUselessIndex: true }] }), // ./bar/index.js exists
      test({ code: 'import "./bar"', options: [{ noUselessIndex: true }] }),
      test({ code: 'import "./bar/"', options: [{ noUselessIndex: true }] }), // ./bar.js exists
      test({ code: 'import "./malformed.js"', options: [{ noUselessIndex: true }] }), // ./malformed directory does not exist
      test({ code: 'import "./malformed"', options: [{ noUselessIndex: true }] }), // ./malformed directory does not exist
      test({ code: 'import "./importType"', options: [{ noUselessIndex: true }] }), // ./importType.js does not exist

      test({ code: 'import(".")'
           , parser: 'babel-eslint' }),
      test({ code: 'import("..")'
           , parser: 'babel-eslint' }),
      test({ code: 'import("fs").then(function(fs){})'
           , parser: 'babel-eslint' }),
    ],

    invalid: [
      // CommonJS modules
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

      // CommonJS modules + noUselessIndex
      test({
        code: 'require("./bar/index.js")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index.js", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'require("./bar/index")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'require("./importPath/")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./importPath/index.js")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index.js", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./importType/index")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importType/index", should be "./importType"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./index")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./index", should be "."'],
      }),
      test({
        code: 'require("../index")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "../index", should be ".."'],
      }),
      test({
        code: 'require("../index.js")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "../index.js", should be ".."'],
      }),

      // ES modules
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

      // ES modules + noUselessIndex
      test({
        code: 'import "./bar/index.js"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index.js", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'import "./bar/index"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'import "./importPath/"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./importPath/index.js"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index.js", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./importPath/index"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./index"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./index", should be "."'],
      }),
      test({
        code: 'import "../index"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "../index", should be ".."'],
      }),
      test({
        code: 'import "../index.js"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "../index.js", should be ".."'],
      }),
      test({
        code: 'import("./")',
        errors: [ 'Useless path segments for "./", should be "."'],
        parser: 'babel-eslint',
      }),
      test({
        code: 'import("../")',
        errors: [ 'Useless path segments for "../", should be ".."'],
        parser: 'babel-eslint',
      }),
      test({
        code: 'import("./deep//a")',
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
        parser: 'babel-eslint',
      }),
    ],
  })
}

['node', 'webpack'].forEach(runResolverTests)
