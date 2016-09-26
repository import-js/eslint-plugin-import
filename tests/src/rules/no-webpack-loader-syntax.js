import { test } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-webpack-loader-syntax')

const message = 'Do not use import syntax to configure webpack loaders.'

ruleTester.run('no-webpack-loader-syntax', rule, {
  valid: [
    test({ code: 'import _ from "lodash"'}),
    test({ code: 'import find from "lodash.find"'}),
    test({ code: 'import foo from "./foo.css"'}),
    test({ code: 'import data from "@scope/my-package/data.json"'}),
    test({ code: 'var _ = require("lodash")'}),
    test({ code: 'var find = require("lodash.find")'}),
    test({ code: 'var foo = require("./foo")'}),
    test({ code: 'var foo = require("../foo")'}),
    test({ code: 'var foo = require("foo")'}),
    test({ code: 'var foo = require("./")'}),
    test({ code: 'var foo = require("@scope/foo")'}),
  ],
  invalid: [
    test({
      code: 'import _ from "babel!lodash"',
      errors: [
        { message: `Unexpected '!' in 'babel!lodash'. ${message}` },
      ],
    }),
    test({
      code: 'import find from "-babel-loader!lodash.find"',
      errors: [
        { message: `Unexpected '!' in '-babel-loader!lodash.find'. ${message}` },
      ],
    }),
    test({
      code: 'import foo from "style!css!./foo.css"',
      errors: [
        { message: `Unexpected '!' in 'style!css!./foo.css'. ${message}` },
      ],
    }),
    test({
      code: 'import data from "json!@scope/my-package/data.json"',
      errors: [
        { message: `Unexpected '!' in 'json!@scope/my-package/data.json'. ${message}` },
      ],
    }),
    test({
      code: 'var _ = require("babel!lodash")',
      errors: [
        { message: `Unexpected '!' in 'babel!lodash'. ${message}` },
      ],
    }),
    test({
      code: 'var find = require("-babel-loader!lodash.find")',
      errors: [
        { message: `Unexpected '!' in '-babel-loader!lodash.find'. ${message}` },
      ],
    }),
    test({
      code: 'var foo = require("style!css!./foo.css")',
      errors: [
        { message: `Unexpected '!' in 'style!css!./foo.css'. ${message}` },
      ],
    }),
    test({
      code: 'var data = require("json!@scope/my-package/data.json")',
      errors: [
        { message: `Unexpected '!' in 'json!@scope/my-package/data.json'. ${message}` },
      ],
    }),
  ],
})
