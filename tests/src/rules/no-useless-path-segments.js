import { parsers, test } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-useless-path-segments');

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

      test({ code: 'import(".")',
        parser: parsers.BABEL_OLD }),
      test({ code: 'import("..")',
        parser: parsers.BABEL_OLD }),
      test({ code: 'import("fs").then(function(fs) {})',
        parser: parsers.BABEL_OLD }),
    ],

    invalid: [
      // CommonJS modules
      test({
        code: 'require("./../files/malformed.js")',
        output: 'require("../files/malformed.js")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./../files/malformed.js", should be "../files/malformed.js"'],
      }),
      test({
        code: 'require("./../files/malformed")',
        output: 'require("../files/malformed")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./../files/malformed", should be "../files/malformed"'],
      }),
      test({
        code: 'require("../files/malformed.js")',
        output: 'require("./malformed.js")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../files/malformed.js", should be "./malformed.js"'],
      }),
      test({
        code: 'require("../files/malformed")',
        output: 'require("./malformed")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../files/malformed", should be "./malformed"'],
      }),
      test({
        code: 'require("./test-module/")',
        output: 'require("./test-module")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./test-module/", should be "./test-module"'],
      }),
      test({
        code: 'require("./")',
        output: 'require(".")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./", should be "."'],
      }),
      test({
        code: 'require("../")',
        output: 'require("..")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "../", should be ".."'],
      }),
      test({
        code: 'require("./deep//a")',
        output: 'require("./deep/a")',
        options: [{ commonjs: true }],
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
      }),

      // CommonJS modules + noUselessIndex
      test({
        code: 'require("./bar/index.js")',
        output: 'require("./bar/")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index.js", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'require("./bar/index")',
        output: 'require("./bar/")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'require("./importPath/")',
        output: 'require("./importPath")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./importPath/index.js")',
        output: 'require("./importPath")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index.js", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./importType/index")',
        output: 'require("./importType")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./importType/index", should be "./importType"'], // ./importPath.js does not exist
      }),
      test({
        code: 'require("./index")',
        output: 'require(".")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "./index", should be "."'],
      }),
      test({
        code: 'require("../index")',
        output: 'require("..")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "../index", should be ".."'],
      }),
      test({
        code: 'require("../index.js")',
        output: 'require("..")',
        options: [{ commonjs: true, noUselessIndex: true }],
        errors: ['Useless path segments for "../index.js", should be ".."'],
      }),

      // ES modules
      test({
        code: 'import "./../files/malformed.js"',
        output: 'import "../files/malformed.js"',
        errors: [ 'Useless path segments for "./../files/malformed.js", should be "../files/malformed.js"'],
      }),
      test({
        code: 'import "./../files/malformed"',
        output: 'import "../files/malformed"',
        errors: [ 'Useless path segments for "./../files/malformed", should be "../files/malformed"'],
      }),
      test({
        code: 'import "../files/malformed.js"',
        output: 'import "./malformed.js"',
        errors: [ 'Useless path segments for "../files/malformed.js", should be "./malformed.js"'],
      }),
      test({
        code: 'import "../files/malformed"',
        output: 'import "./malformed"',
        errors: [ 'Useless path segments for "../files/malformed", should be "./malformed"'],
      }),
      test({
        code: 'import "./test-module/"',
        output: 'import "./test-module"',
        errors: [ 'Useless path segments for "./test-module/", should be "./test-module"'],
      }),
      test({
        code: 'import "./"',
        output: 'import "."',
        errors: [ 'Useless path segments for "./", should be "."'],
      }),
      test({
        code: 'import "../"',
        output: 'import ".."',
        errors: [ 'Useless path segments for "../", should be ".."'],
      }),
      test({
        code: 'import "./deep//a"',
        output: 'import "./deep/a"',
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
      }),

      // ES modules + noUselessIndex
      test({
        code: 'import "./bar/index.js"',
        output: 'import "./bar/"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index.js", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'import "./bar/index"',
        output: 'import "./bar/"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./bar/index", should be "./bar/"'], // ./bar.js exists
      }),
      test({
        code: 'import "./importPath/"',
        output: 'import "./importPath"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./importPath/index.js"',
        output: 'import "./importPath"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index.js", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./importPath/index"',
        output: 'import "./importPath"',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./importPath/index", should be "./importPath"'], // ./importPath.js does not exist
      }),
      test({
        code: 'import "./index"',
        output: 'import "."',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "./index", should be "."'],
      }),
      test({
        code: 'import "../index"',
        output: 'import ".."',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "../index", should be ".."'],
      }),
      test({
        code: 'import "../index.js"',
        output: 'import ".."',
        options: [{ noUselessIndex: true }],
        errors: ['Useless path segments for "../index.js", should be ".."'],
      }),
      test({
        code: 'import("./")',
        output: 'import(".")',
        errors: [ 'Useless path segments for "./", should be "."'],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: 'import("../")',
        output: 'import("..")',
        errors: [ 'Useless path segments for "../", should be ".."'],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: 'import("./deep//a")',
        output: 'import("./deep/a")',
        errors: [ 'Useless path segments for "./deep//a", should be "./deep/a"'],
        parser: parsers.BABEL_OLD,
      }),
    ],
  });
}

['node', 'webpack'].forEach(runResolverTests);
