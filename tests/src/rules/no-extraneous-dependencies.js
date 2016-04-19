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

    // 'project' type
    test({
      code: 'import "importType"',
      settings: { "import/resolver": { node: { paths: [ path.join(__dirname, '../../files') ] } } },
    }),
  ],
  invalid: [
    test({
      code: 'import "not-a-dependency"',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' is not listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "eslint"',
      options: [{devDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'eslint\' is not listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'var foo = require("not-a-dependency");',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' is not listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var eslint = require("eslint");',
      options: [{devDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'eslint\' is not listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
  ],
})
