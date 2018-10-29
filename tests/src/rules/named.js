import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve'


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
    test({
      code: 'import { foo, bar } from "./re-export-names-es5"',
      options: [{ commonjs: { exports: true }}],
     }),
    test({
      code: 'import { foo, bar } from "./re-export-names-es5"',
      options: [{ commonjs: true }],
    }),

    test({ code: 'import { foo, bar } from "./common"'
         , settings: { 'import/ignore': ['common'] } }),

    // ignore core modules by default
    test({ code: 'import { foo } from "crypto"' }),
    test({ code: 'import { zoob } from "a"' }),

    test({ code: 'import { someThing } from "./test-module"' }),

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
    test({ code: 'import { deepProp, deepSparseElement } from "./named-exports-es5"' }),
    test({
      code: 'import { deepProp, deepSparseElement } from "./named-exports-es5"',
      options: [{ commonjs: { exports: true } }],
     }),
    test({ code: 'import { deepSparseElement } from "./named-exports"' }),

    // should ignore imported flow types, even if they don’t exist
    test({
      code: 'import type { MissingType } from "./flowtypes"',
      parser: 'babel-eslint',
    }),
    test({
      code: 'import type { MyOpaqueType } from "./flowtypes"',
      parser: 'babel-eslint',
    }),
    test({
      code: 'import  { type MyOpaqueType, MyClass } from "./flowtypes"',
      parser: 'babel-eslint',
    }),

    // TypeScript
    test({
      code: 'import { MyType } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: 'import { Foo } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: 'import { Bar } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: 'import { getFoo } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: 'import { MyEnum } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: `
        import { MyModule } from "./typescript"
        MyModule.ModuleFunction()
      `,
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: `
        import { MyNamespace } from "./typescript"
        MyNamespace.NSModule.NSModuleFunction()
      `,
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
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
    test({
      code: 'import { createStore } from "redux/lib/index"',
      options: [{ commonjs: true }],
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

    // ignore CJS by default. always ignore ignore list
    test({ code: 'import {a, b, d} from "./common"' }),
    test({
      code: 'import { baz } from "./bar"',
      settings: { 'import/ignore': ['bar'] },
    }),
    test({
      code: 'import { common } from "./re-export-default"',
    }),

    // direct module exports cases
    test({
      code: 'import { a, c } from "./module-exports-direct"',
      options: [{ commonjs: true }],
    }),

    test({
      code: 'import { default as n } from "./module-exports-number"',
      options: [{ commonjs: true }],
    }),

    ...SYNTAX_CASES,
  ],

  invalid: [

    test({ code: 'import { somethingElse } from "./test-module"'
         , errors: [ error('somethingElse', './test-module') ] }),

    test({code: 'import { baz } from "./bar"',
      errors: [error('baz', './bar')]}),

    // test multiple
    test({code: 'import { baz, bop } from "./bar"',
      errors: [error('baz', './bar'), error('bop', './bar')]}),

    test({code: 'import {a, b, c} from "./named-exports"',
      errors: [error('c', './named-exports')]}),

    test({code: 'import { a } from "./default-export"',
      errors: [error('a', './default-export')]}),

    test({code: 'import { ActionTypess } from "./qc"',
      errors: [error('ActionTypess', './qc')]}),

    test({code: 'import {a, b, c, d, e} from "./re-export"',
      errors: [error('e', './re-export')]}),

    test({
      code: 'import { a } from "./re-export-names"',
      options: [{ commonjs: true }],
      errors: [error('a', './re-export-names')],
    }),

    test({
      code: 'import { a } from "./re-export-names-es5"',
      options: [{ commonjs: true }],
      errors: [error('a', './re-export-names-es5')],
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
    // test({
    //   code: "import { a } from './test.coffee';",
    //   settings: { 'import/extensions': ['.js', '.coffee'] },
    //   errors: [{
    //     message: "Parse errors in imported module './test.coffee': Unexpected token > (1:20)",
    //     type: 'Literal',
    //   }],
    // }),

    // TypeScript
    test({
      code: 'import { MissingType } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      errors: [{
        message: "MissingType not found in './typescript'",
        type: 'Identifier',
      }],
    }),
    test({
      code: 'import { NotExported } from "./typescript"',
      parser: 'typescript-eslint-parser',
      settings: {
        'import/parsers': { 'typescript-eslint-parser': ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      errors: [{
        message: "NotExported not found in './typescript'",
        type: 'Identifier',
      }],
    }),

    test({
      code: 'import  { type MyOpaqueType, MyMissingClass } from "./flowtypes"',
      parser: 'babel-eslint',
      errors: ["MyMissingClass not found in './flowtypes'"],
    }),

    // jsnext
    test({
      code: '/*jsnext*/ import { createSnorlax } from "redux"',
      settings: { 'import/ignore': [] },
      errors: ["createSnorlax not found in 'redux'"],
    }),
    test({
      code: 'import { createSnorlax } from "redux/lib/index"',
      settings: { 'import/ignore': [] },
      options: [{ commonjs: true }],
      errors: ["createSnorlax not found in 'redux/lib/index'"],
    }),
    // should work without ignore
    test({
      code: '/*jsnext*/ import { createSnorlax } from "redux"',
      errors: ["createSnorlax not found in 'redux'"],
    }),
    test({
      code: 'import { createSnorlax } from "redux/lib/index"',
      options: [{ commonjs: { exports: true } }],
      errors: ["createSnorlax not found in 'redux/lib/index'"],
    }),


    // ignore is ignored if exports are found
    test({
      code: 'import { baz } from "es6-module"',
      errors: ["baz not found in 'es6-module'"],
    }),

    // issue #251
    test({
      code: 'import { foo, bar, bap } from "./re-export-default"',
      errors: ["bap not found in './re-export-default'"],
    }),


    // #328: * exports do not include default
    test({
      code: 'import { default as barDefault } from "./re-export"',
      errors: [`default not found in './re-export'`],
    }),

    // direct module.exports assignment
    test({
      code: 'import { b } from "./module-exports-direct"',
      options: [{ commonjs: true }],
      errors: [ error('b', './module-exports-direct') ],
    }),

    test({
      code: 'import { noExports } from "./module-exports-number"',
      options: [{ commonjs: true }],
      errors: [ error('noExports', './module-exports-number') ],
    }),
  ],
})

// #311: import of mismatched case
if (!CASE_SENSITIVE_FS) {
  ruleTester.run('named (path case-insensitivity)', rule, {
    valid: [
      test({
        code: 'import { b } from "./Named-Exports"',
      }),
    ],
    invalid: [
      test({
        code: 'import { foo } from "./Named-Exports"',
        errors: [`foo not found in './Named-Exports'`],
      }),
    ],
  })
}

// export-all
ruleTester.run('named (export *)', rule, {
  valid: [
    test({
      code: 'import { foo } from "./export-all"',
    }),
  ],
  invalid: [
    test({
      code: 'import { bar } from "./export-all"',
      errors: [`bar not found in './export-all'`],
    }),
  ],
})
