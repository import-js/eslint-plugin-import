import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/max-depth')

ruleTester.run('max-depth', rule, {
  valid: [
    test({code: 'import "./foo.js"'}),
    test({code: 'import "../bar/baz.js"'}),
    test({code: 'import a from "./foo.js"'}),
    test({code: 'import b from "../bar/baz.js"'}),
    test({code: 'const a = require("./foo.js")'}),
    test({code: 'const b = require("../bar/baz.js")'}),
    test({code: 'import "lodash"'}),
    test({code: 'import _ from "lodash"'}),
    test({code: 'const _ = require("lodash")'}),
    test({
        code: 'import map from "lodash/map"',
        options: [{
            overridePackages: {'lodash': 1},
        }],
    }),
    test({
        code: 'import map from "lodash/map"',
        options: [{
            max: 1,
        }],
    }),
  ],
  invalid: [
    test({
        code: 'import map from "lodash/map"',
        errors: [
          'Import \'lodash/map\' exceeds max nesting depth of 0 (actual: 1).',
        ],
    }),
    test({
        code: 'import map from "lodash/fp/map"',
        options: [{
          max: 1,
        }],
        errors: [
          'Import \'lodash/fp/map\' exceeds max nesting depth of 1 (actual: 2).',
        ],
    }),
    test({
        code: 'import map from "lodash/fp/map"',
        options: [{
            overridePackages: {'lodash': 1},
        }],
        errors: [
          'Import \'lodash/fp/map\' exceeds max nesting depth of 1 (actual: 2).',
        ],
    }),
  ],
})
