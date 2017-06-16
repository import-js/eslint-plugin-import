import { RuleTester } from 'eslint'
import rule from 'rules/extensions'
import { test } from '../utils'

const ruleTester = new RuleTester()

ruleTester.run('extensions', rule, {
  valid: [
    test({ code: 'import a from "a"' }),
    test({ code: 'import dot from "./file.with.dot"' }),
    test({
      code: 'import a from "a/index.js"',
      options: [ 'always' ],
    }),
    test({
      code: 'import dot from "./file.with.dot.js"',
      options: [ 'always' ],
    }),
    test({
      code: [
        'import a from "a"',
        'import packageConfig from "./package.json"',
      ].join('\n'),
      options: [ { json: 'always', js: 'never' } ],
    }),
    test({
      code: [
        'import lib from "./bar"',
        'import component from "./bar.jsx"',
        'import data from "./bar.json"',
      ].join('\n'),
      options: [ 'never' ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json' ] } },
    }),

    test({
      code: [
        'import bar from "./bar"',
        'import barjson from "./bar.json"',
        'import barhbs from "./bar.hbs"',
      ].join('\n'),
      options: [ 'always', { js: 'never', jsx: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json', '.hbs' ] } },
    }),

    test({
      code: [
        'import bar from "./bar.js"',
        'import pack from "./package"',
      ].join('\n'),
      options: [ 'never', { js: 'always', json: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.json' ] } },
    }),

    // unresolved (#271/#295)
    test({ code: 'import path from "path"' }),
    test({ code: 'import path from "path"', options: [ 'never' ] }),
    test({ code: 'import path from "path"', options: [ 'always' ] }),
    test({ code: 'import thing from "./fake-file.js"', options: [ 'always' ] }),
    test({ code: 'import thing from "non-package"', options: [ 'never' ] }),

  ],

  invalid: [
    test({
      code: 'import a from "a/index.js"',
      errors: [ {
        message: 'Unexpected use of file extension "js" for "a/index.js"',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import a from "a"',
      options: [ 'always' ],
      errors: [ {
        message: 'Missing file extension "js" for "a"',
        line: 1,
        column: 15,
      } ],
    }),
    test({
      code: 'import dot from "./file.with.dot"',
      options: [ 'always' ],
      errors: [
        {
          message: 'Missing file extension "js" for "./file.with.dot"',
          line: 1,
          column: 17,
        },
      ],
    }),
    test({
      code: [
        'import a from "a/index.js"',
        'import packageConfig from "./package"',
      ].join('\n'),
      options: [ { json: 'always', js: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.json' ] } },
      errors: [
        {
          message: 'Unexpected use of file extension "js" for "a/index.js"',
          line: 1,
          column: 15,
        },
        {
          message: 'Missing file extension "json" for "./package"',
          line: 2,
          column: 27,
        },
      ],
    }),
    test({
      code: [
        'import lib from "./bar.js"',
        'import component from "./bar.jsx"',
        'import data from "./bar.json"',
      ].join('\n'),
      options: [ 'never' ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json' ] } },
      errors: [
        {
            message: 'Unexpected use of file extension "js" for "./bar.js"',
            line: 1,
            column: 17,
        },
      ],
    }),
    test({
      code: [
        'import lib from "./bar.js"',
        'import component from "./bar.jsx"',
        'import data from "./bar.json"',
      ].join('\n'),
      options: [ { json: 'always', js: 'never', jsx: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json' ] } },
      errors: [
        {
            message: 'Unexpected use of file extension "js" for "./bar.js"',
            line: 1,
            column: 17,
        },
      ],
    }),

    test({
      code: [
        'import barjs from "./bar.js"',
        'import barjson from "./bar.json"',
        'import barnone from "./bar"',
      ].join('\n'),
      options: [ 'always', { json: 'always', js: 'never', jsx: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json' ] } },
      errors: [
        {
            message: 'Unexpected use of file extension "js" for "./bar.js"',
            line: 1,
            column: 19,
        },
      ],
    }),

    test({
      code: [
        'import barjs from "./bar.js"',
        'import barjson from "./bar.json"',
        'import barnone from "./bar"',
      ].join('\n'),
      options: [ 'never', { json: 'always', js: 'never', jsx: 'never' } ],
      settings: { 'import/resolve': { 'extensions': [ '.js', '.jsx', '.json' ] } },
      errors: [
        {
            message: 'Unexpected use of file extension "js" for "./bar.js"',
            line: 1,
            column: 19,
        },
      ],
    }),

    // unresolved (#271/#295)
    test({
      code: 'import thing from "./fake-file.js"',
      options: [ 'never' ],
      errors: [
        {
            message: 'Unexpected use of file extension "js" for "./fake-file.js"',
            line: 1,
            column: 19,
        },
      ],
    }),
    test({
      code: 'import thing from "non-package"',
      options: [ 'always' ],
      errors: [
        {
            message: 'Missing file extension for "non-package"',
            line: 1,
            column: 19,
        },
      ],
    }),

  ],
})
