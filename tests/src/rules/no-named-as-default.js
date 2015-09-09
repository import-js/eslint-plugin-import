var test = require('../utils').test

var linter = require('eslint').linter,
    RuleTester = require('eslint').RuleTester

var ruleTester = new RuleTester()
  , rule = require('../../../lib/rules/no-named-as-default')

ruleTester.run('no-named-as-default', rule, {
  valid: [ test({code: 'import bar, { foo } from "./bar";'})
         , test({code: 'import bar, { foo } from "./empty-folder";'})

           // es7
         , test({ code: 'export bar, { foo } from "./bar";'
                , parser: 'babel-eslint'
                })
         , test({ code: 'export bar from "./bar";'
                , parser: 'babel-eslint'
                })
         ]

, invalid: [
    test({
      code: 'import foo from "./bar";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ImportDefaultSpecifier' } ] })
  , test({
      code: 'import foo, { foo as bar } from "./bar";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ImportDefaultSpecifier' } ] })

    // es7
  , test({
      code: 'export foo from "./bar";',
      parser: 'babel-eslint',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ExportDefaultSpecifier' } ] })
  , test({
      code: 'export foo, { foo as bar } from "./bar";',
      parser: 'babel-eslint',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.'
      , type: 'ExportDefaultSpecifier' } ] })
  ]
})
