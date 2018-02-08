import { test } from '../utils'
import path from 'path'
import fs from 'fs'
import os from 'os'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-extraneous-dependencies')

const packageDirWithSyntaxError = path.join(__dirname, '../../files/with-syntax-error')
const packageFileWithSyntaxErrorMessage = (() => {
  const location = path.join(packageDirWithSyntaxError, 'package.json')

  try {
    JSON.parse(fs.readFileSync(location))
  } catch (error) {
    return error.message + ': ' + location
  }
})()
const packageDirWithFlowTyped = path.join(__dirname, '../../files/with-flow-typed')

ruleTester.run('no-extraneous-dependencies', rule, {
  valid: [
    test({ code: 'import "lodash.cond"'}),
    test({ code: 'import "pkg-up"'}),
    test({ code: 'import foo, { bar } from "lodash.cond"'}),
    test({ code: 'import foo, { bar } from "pkg-up"'}),
    test({ code: 'import "eslint"'}),
    test({ code: 'import "eslint/lib/api"'}),
    test({ code: 'require("lodash.cond")'}),
    test({ code: 'require("pkg-up")'}),
    test({ code: 'var foo = require("lodash.cond")'}),
    test({ code: 'var foo = require("pkg-up")'}),
    test({ code: 'import "fs"'}),
    test({ code: 'import "./foo"'}),
    test({ code: 'import "lodash.isarray"'}),
    test({ code: 'import "@org/package"'}),

    test({ code: 'import "electron"', settings: { 'import/core-modules': ['electron'] } }),
    test({ code: 'import "eslint"' }),
    test({
      code: 'import "eslint"',
      options: [{peerDependencies: true}],
    }),

    // 'project' type
    test({
      code: 'import "importType"',
      settings: { 'import/resolver': { node: { paths: [ path.join(__dirname, '../../files') ] } } },
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.spec.js']}],
      filename: 'foo.spec.js',
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({ code: 'require(6)' }),
    test({
      code: 'import "doctrine"',
      options: [{packageDir: path.join(__dirname, '../../../')}],
    }),
    test({
      code: 'import type MyType from "myflowtyped";',
      options: [{packageDir: packageDirWithFlowTyped}],
      parser: 'babel-eslint',
    }),
  ],
  invalid: [
    test({
      code: 'import "not-a-dependency"',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency/foo")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "eslint"',
      options: [{devDependencies: false, peerDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'eslint\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import "lodash.isarray"',
      options: [{optionalDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'var foo = require("not-a-dependency")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var glob = require("glob")',
      options: [{devDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'glob\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: 'foo.tes.js',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: 'foo.tes.js',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'var eslint = require("lodash.isarray")',
      options: [{optionalDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{packageDir: path.join(__dirname, '../../../')}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "bar"',
      options: [{packageDir: path.join(__dirname, 'doesn-exist')}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'Could not find package.json file: ' + path.join(path.join(__dirname, 'doesn-exist', 'package.json')),
      }]
    }),
    test({
      code: 'import "bar"',
      options: [{packageDir: '/does/not/exist'}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'Could not find package.json file: /does/not/exist/package.json',
      }]
    }),
    test({
      code: 'import "bar"',
      filename: path.join('/does/not/exist', 'file.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'Could not find package.json files: ' + os.EOL + [
          '/does/not/exist/package.json',
          '/does/not/package.json',
          '/does/package.json',
          '/package.json',
        ].join(os.EOL),
      }]
    }),
    test({
      code: 'import "foo"',
      options: [{packageDir: packageDirWithSyntaxError}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'Could not parse package.json file: ' + packageFileWithSyntaxErrorMessage,
      }],
    }),
  ],
})
