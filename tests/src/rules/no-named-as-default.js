'use strict'

var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

var test = require('../../utils').test

eslintTester.addRuleTest('lib/rules/no-named-as-default', {
  valid: [ test({code: 'import bar, { foo } from "./bar";'})
         , test({code: 'import bar, { foo } from "./empty-folder";'}) ]

, invalid: [
    test({
      code: 'import foo, { foo as bar } from "./bar";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ImportDefaultSpecifier' } ] })
  ]
})
