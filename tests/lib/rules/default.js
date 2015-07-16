'use strict'

var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

var test = require('../../utils').test

eslintTester.addRuleTest('lib/rules/default', {
  valid: [
    test({code: 'import foo from "./empty-folder";'}),
    test({code: 'import { foo } from "./default-export";'}),
    test({code: 'import foo from "./default-export";'}),
    test({code: 'import foo from "./mixed-exports";'}),
    test({
      code: 'import bar from "./default-export";'}),
    test({
      code: 'import CoolClass from "./default-class";'}),
    test({
      code: 'import bar, { baz } from "./default-export";'})

    // core modules always have a default
  , test({ code: 'import crypto from "crypto";' })

  , test({ code: 'import common from "./common";'
         , settings: { 'import/ignore': ['common'] } })
  ],

  invalid: [
    test({
      code: 'import crypto from "./common";',
      settings: { 'import/ignore': ['foo'] },
      errors: [{ message: 'No default export found in module.'
               , type: 'ImportDefaultSpecifier'}]}),
    test({
      code: 'import baz from "./named-exports";',
      errors: [{ message: 'No default export found in module.'
               , type: 'ImportDefaultSpecifier'}]}),

    test({
      code: 'import bar from "./common";',
      errors: [{ message: 'No default export found in module.'
               , type: 'ImportDefaultSpecifier'}]})
  ]
})
