import { test } from '../utils'
import * as path from 'path'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-extraneous-dependencies')

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
    test({ code: 'import "@scope/core"'}),

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
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: 'foo.spec.js',
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
      code: 'var donthaveit = require("@scope/donthaveit")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@scope/donthaveit\' should be listed in the project\'s dependencies. Run \'npm i -S @scope/donthaveit\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@scope/donthaveit/lib/foo")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@scope/donthaveit\' should be listed in the project\'s dependencies. Run \'npm i -S @scope/donthaveit\' to add it',
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
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: 'foo.tes.js',
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
  ],
})
