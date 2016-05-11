import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('rules/named')

function error(name, module) {
  return { message: name + ' not found in \'' + module + '\''
         , type: 'Identifier' }
}

ruleTester.run('named', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({code: 'import { foo } from "./bar"'}),
    test({code: 'import { foo } from "./empty-module"'}),
    test({code: 'import bar from "./bar.js"'}),
    test({code: 'import bar, { foo } from "./bar.js"'}),
    test({code: 'import {a, b, d} from "./named-exports"'}),
    test({code: 'import {ExportedClass} from "./named-exports"'}),
    test({code: 'import { ActionTypes } from "./qc"'}),
    test({code: 'import {a, b, c, d} from "./re-export"'}),

    test({ code: 'import { jsxFoo } from "./jsx/AnotherComponent"'
         , settings: { 'import/resolve': { 'extensions': ['.js', '.jsx'] } } }),

    // validate that eslint-disable-line silences this properly
    test({code: 'import {a, b, d} from "./common"; ' +
                '// eslint-disable-line named' }),

    test({ code: 'import { foo, bar } from "./re-export-names"' }),

    test({ code: 'import { foo, bar } from "./common"'
         , settings: { 'import/ignore': ['common'] } }),

    // ignore core modules by default
    test({ code: 'import { foo } from "crypto"' }),
    test({ code: 'import { zoob } from "a"' }),

    test({ code: 'import { someThing } from "./test-module"' }),

    // node_modules/a only exports 'foo', should be ignored though
    test({ code: 'import { zoob } from "a"' }),

    // export tests
    test({ code: 'export { foo } from "./bar"' }),
    test({ code: 'export { foo as bar } from "./bar"' }),
    test({ code: 'export { foo } from "./does-not-exist"' }),

    // es7
    test({
      code: 'export bar, { foo } from "./bar"',
      parser: 'babel-eslint',
    }),
    test({
      code: 'import { foo, bar } from "./named-trampoline"',
      parser: 'babel-eslint',
    }),

    // regression tests
    test({ code: 'export { foo as bar }'}),

    // destructured exports
    test({ code: 'import { destructuredProp } from "./named-exports"' }),
    test({ code: 'import { arrayKeyProp } from "./named-exports"' }),
    test({ code: 'import { deepProp } from "./named-exports"' }),
    test({ code: 'import { deepSparseElement } from "./named-exports"' }),

    // flow types
    test({
      code: 'import type { MyType } from "./flowtypes"',
      'parser': 'babel-eslint',
    }),

    // jsnext
    test({
      code: '/*jsnext*/ import { createStore } from "redux"',
      settings: { 'import/ignore': [] },
    }),
    // should work without ignore
    test({
      code: '/*jsnext*/ import { createStore } from "redux"',
    }),

    // ignore is ignored if exports are found
    test({ code: 'import { foo } from "es6-module"' }),

    // issue #210: shameless self-reference
    test({ code: 'import { me, soGreat } from "./narcissist"' }),

    // issue #251: re-export default as named
    test({ code: 'import { foo, bar, baz } from "./re-export-default"' }),
    test({
      code: 'import { common } from "./re-export-default"',
      settings: { 'import/ignore': ['common'] },
    }),

    ...SYNTAX_CASES,
  ],

  invalid: [

    test({ code: 'import { zoob } from "a"'
         , settings: { 'import/ignore': [] }
         , errors: [ error('zoob', 'a') ] }),

    test({ code: 'import { somethingElse } from "./test-module"'
         , errors: [ error('somethingElse', './test-module') ] }),

    test({code: 'import {a, b, d} from "./common"',
      errors: [ error('a', './common')
              , error('b', './common')
              , error('d', './common') ]}),

    test({code: 'import { baz } from "./bar"',
      errors: [error('baz', './bar')]}),

    // test multiple
    test({code: 'import { baz, bop } from "./bar"',
      errors: [error('baz', './bar'), error('bop', './bar')]}),

    test({code: 'import {a, b, c} from "./named-exports"',
      errors: [error('c', './named-exports')]}),

    test({code: 'import { a } from "./default-export"',
      errors: [error('a', './default-export')]}),

    test({code: 'import { a } from "./common"', args: [2, 'es6-only'],
      errors: [error('a', './common')]}),

    test({code: 'import { ActionTypess } from "./qc"',
      errors: [error('ActionTypess', './qc')]}),

    test({code: 'import {a, b, c, d, e} from "./re-export"',
      errors: [error('e', './re-export')]}),

    test({
      code: 'import { a } from "./re-export-names"',
      args: [2, 'es6-only'],
      errors: [error('a', './re-export-names')],
    }),

    // export tests
    test({
      code: 'export { bar } from "./bar"',
      errors: ["bar not found in './bar'"],
    }),

    // es7
    test({
      code: 'export bar2, { bar } from "./bar"',
      parser: 'babel-eslint',
      errors: ["bar not found in './bar'"],
    }),
    test({
      code: 'import { foo, bar, baz } from "./named-trampoline"',
      parser: 'babel-eslint',
      errors: ["baz not found in './named-trampoline'"],
    }),
    test({
      code: 'import { baz } from "./broken-trampoline"',
      parser: 'babel-eslint',
      errors: ["baz not found via broken-trampoline.js -> named-exports.js"],
    }),

    // parse errors
    test({
      code: "import { a } from './test.coffee';",
      settings: { 'import/extensions': ['.js', '.coffee'] },
      errors: [{
        message: "Parse errors in imported module './test.coffee': Unexpected token > (1:20)",
        type: 'Literal',
      }],
    }),

    // flow types
    test({
      code: 'import type { MissingType } from "./flowtypes"',
      parser: 'babel-eslint',
      errors: [{
        message: "MissingType not found in './flowtypes'",
        type: 'Identifier',
      }],
    }),

    // jsnext
    test({
      code: '/*jsnext*/ import { createSnorlax } from "redux"',
      settings: { 'import/ignore': [] },
      errors: ["createSnorlax not found in 'redux'"],
    }),
    // should work without ignore
    test({
      code: '/*jsnext*/ import { createSnorlax } from "redux"',
      errors: ["createSnorlax not found in 'redux'"],
    }),

    // ignore is ignored if exports are found
    test({
      code: 'import { baz } from "es6-module"',
      errors: ["baz not found in 'es6-module'"],
    }),
    test({
      code: 'import { baz } from "./bar"',
      settings: { 'import/ignore': ['bar'] },
      errors: ["baz not found in './bar'"],
    }),

    // issue #251
    test({
      code: 'import { foo, bar, bap } from "./re-export-default"',
      errors: ["bap not found in './re-export-default'"],
    }),
    test({
      code: 'import { common } from "./re-export-default"',
      // todo: better error message
      errors: ["common not found via re-export-default.js -> common.js"],
    }),

    // #328: * exports do not include default
    test({
      code: 'import { default as barDefault } from "./re-export"',
      errors: [`default not found in './re-export'`],
    }),
  ],
})
