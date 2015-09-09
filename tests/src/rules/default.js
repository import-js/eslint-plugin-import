'use strict'

var test = require('../utils').test

var linter = require('eslint').linter,
    RuleTester = require('eslint').RuleTester

var ruleTester = new RuleTester()
  , rule = require('../../../lib/rules/default')

ruleTester.run('default', rule, {
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

    // es7 export syntax
  , test({ code: 'export bar from "./bar"'
         , parser: 'babel-eslint'
         })
  , test({ code: 'export bar, { foo } from "./bar"'
         , parser: 'babel-eslint'
         })
  , test({ code: 'export bar, * as names from "./bar"'
         , parser: 'babel-eslint'
         })

    // sanity check
  , test({ code: 'export {a} from "./named-exports"' })

  , test({ code: 'import twofer from "./trampoline"'
         , settings: { 'import/parser': 'babel-eslint' }
         })

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

    // es7 export syntax
  , test({ code: 'export baz from "./named-exports"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  , test({ code: 'export baz, { bar } from "./named-exports"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  , test({ code: 'export baz, * as names from "./named-exports"'
         , parser: 'babel-eslint'
         , errors: 1
         })
    // exports default from a module with no default
  , test({ code: 'import twofer from "./broken-trampoline"'
         , settings: { 'import/parser': 'babel-eslint' }
         , errors: 1
         })
  ]
})
