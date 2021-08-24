import { test, SYNTAX_CASES, getTSParsers, testFilePath, testVersion } from '../utils';
import { RuleTester } from 'eslint';

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve';


const ruleTester = new RuleTester();
const rule = require('rules/named');

function error(name, module) {
  return { message: name + ' not found in \'' + module + '\'',
    type: 'Identifier' };
}

ruleTester.run('named', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import { foo } from "./bar"' }),
    test({ code: 'import { foo } from "./empty-module"' }),
    test({ code: 'import bar from "./bar.js"' }),
    test({ code: 'import bar, { foo } from "./bar.js"' }),
    test({ code: 'import {a, b, d} from "./named-exports"' }),
    test({ code: 'import {ExportedClass} from "./named-exports"' }),
    test({ code: 'import { destructingAssign } from "./named-exports"' }),
    test({ code: 'import { destructingRenamedAssign } from "./named-exports"' }),
    test({ code: 'import { ActionTypes } from "./qc"' }),
    test({ code: 'import {a, b, c, d} from "./re-export"' }),
    test({ code: 'import {a, b, c} from "./re-export-common-star"' }),
    test({ code: 'import {RuleTester} from "./re-export-node_modules"' }),

    test({ code: 'import { jsxFoo } from "./jsx/AnotherComponent"',
      settings: { 'import/resolve': { 'extensions': ['.js', '.jsx'] } } }),

    // validate that eslint-disable-line silences this properly
    test({ code: 'import {a, b, d} from "./common"; ' +
                '// eslint-disable-line named' }),

    test({ code: 'import { foo, bar } from "./re-export-names"' }),

    test({ code: 'import { foo, bar } from "./common"',
      settings: { 'import/ignore': ['common'] } }),

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
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { foo, bar } from "./named-trampoline"',
      parser: require.resolve('babel-eslint'),
    }),

    // regression tests
    test({ code: 'let foo; export { foo as bar }' }),

    // destructured exports
    test({ code: 'import { destructuredProp } from "./named-exports"' }),
    test({ code: 'import { arrayKeyProp } from "./named-exports"' }),
    test({ code: 'import { deepProp } from "./named-exports"' }),
    test({ code: 'import { deepSparseElement } from "./named-exports"' }),

    // should ignore imported/exported flow types, even if they don’t exist
    test({
      code: 'import type { MissingType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import typeof { MissingType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import type { MyOpaqueType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import typeof { MyOpaqueType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { type MyOpaqueType, MyClass } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { typeof MyOpaqueType, MyClass } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import typeof MissingType from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import typeof * as MissingType from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export type { MissingType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'export type { MyOpaqueType } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
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

    // ignore CJS by default. always ignore ignore list
    test({ code: 'import {a, b, d} from "./common"' }),
    test({
      code: 'import { baz } from "./bar"',
      settings: { 'import/ignore': ['bar'] },
    }),
    test({
      code: 'import { common } from "./re-export-default"',
    }),

    // destructured requires with commonjs option
    test({
      code: 'const { destructuredProp } = require("./named-exports")',
      options: [{ commonjs: true }],
    }),
    test({
      code: 'let { arrayKeyProp } = require("./named-exports")',
      options: [{ commonjs: true }],
    }),
    test({
      code: 'const { deepProp } = require("./named-exports")',
      options: [{ commonjs: true }],
    }),

    test({
      code: 'const { foo, bar } = require("./re-export-names")',
      options: [{ commonjs: true }],
    }),

    test({
      code: 'const { baz } = require("./bar")',
      errors: [error('baz', './bar')],
    }),

    test({
      code: 'const { baz } = require("./bar")',
      errors: [error('baz', './bar')],
      options: [{ commonjs: false }],
    }),

    test({
      code: 'const { default: defExport } = require("./bar")',
      options: [{ commonjs: true }],
    }),

    ...SYNTAX_CASES,

    ...[].concat(testVersion('>= 6', () => ({
      code: `import { ExtfieldModel, Extfield2Model } from './models';`,
      filename: testFilePath('./export-star/downstream.js'),
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
      },
    })) || []),
  ],

  invalid: [
    test({ code: 'import { somethingElse } from "./test-module"',
      errors: [ error('somethingElse', './test-module') ] }),

    test({ code: 'import { baz } from "./bar"',
      errors: [error('baz', './bar')] }),

    // test multiple
    test({ code: 'import { baz, bop } from "./bar"',
      errors: [error('baz', './bar'), error('bop', './bar')] }),

    test({ code: 'import {a, b, c} from "./named-exports"',
      errors: [error('c', './named-exports')] }),

    test({ code: 'import { a } from "./default-export"',
      errors: [error('a', './default-export')] }),

    test({ code: 'import { ActionTypess } from "./qc"',
      errors: [error('ActionTypess', './qc')] }),

    test({ code: 'import {a, b, c, d, e} from "./re-export"',
      errors: [error('e', './re-export')] }),

    test({
      code: 'import { a } from "./re-export-names"',
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
      parser: require.resolve('babel-eslint'),
      errors: ["bar not found in './bar'"],
    }),
    test({
      code: 'import { foo, bar, baz } from "./named-trampoline"',
      parser: require.resolve('babel-eslint'),
      errors: ["baz not found in './named-trampoline'"],
    }),
    test({
      code: 'import { baz } from "./broken-trampoline"',
      parser: require.resolve('babel-eslint'),
      errors: ['baz not found via broken-trampoline.js -> named-exports.js'],
    }),

    test({
      code: 'const { baz } = require("./bar")',
      errors: [error('baz', './bar')],
      options: [{ commonjs: true }],
    }),

    test({
      code: 'let { baz } = require("./bar")',
      errors: [error('baz', './bar')],
      options: [{ commonjs: true }],
    }),

    test({
      code: 'const { baz: bar, bop } = require("./bar"), { a } = require("./re-export-names")',
      errors: [error('baz', './bar'), error('bop', './bar'), error('a', './re-export-names')],
      options: [{ commonjs: true }],
    }),

    test({
      code: 'const { default: defExport } = require("./named-exports")',
      errors: [error('default', './named-exports')],
      options: [{ commonjs: true }],
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

    test({
      code: 'import  { type MyOpaqueType, MyMissingClass } from "./flowtypes"',
      parser: require.resolve('babel-eslint'),
      errors: ["MyMissingClass not found in './flowtypes'"],
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
  ],
});

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
  });
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
});


context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    const settings = {
      'import/parsers': { [parser]: ['.ts'] },
      'import/resolver': { 'eslint-import-resolver-typescript': true },
    };

    const valid = [];
    const invalid = [
      test({
        code: `import {a} from './export-star-3/b';`,
        filename: testFilePath('./export-star-3/a.js'),
        parser: parser,
        settings: settings,
      }),
    ];

    [
      'typescript',
      'typescript-declare',
      'typescript-export-assign-namespace',
      'typescript-export-assign-namespace-merged',
    ].forEach((source) => {
      valid.push(
        test({
          code: `import { MyType } from "./${source}"`,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `import { Foo } from "./${source}"`,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `import { Bar } from "./${source}"`,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `import { getFoo } from "./${source}"`,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `import { MyEnum } from "./${source}"`,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `
              import { MyModule } from "./${source}"
              MyModule.ModuleFunction()
            `,
          parser: parser,
          settings: settings,
        }),
        test({
          code: `
              import { MyNamespace } from "./${source}"
              MyNamespace.NSModule.NSModuleFunction()
            `,
          parser: parser,
          settings: settings,
        }),
      );

      invalid.push(
        test({
          code: `import { MissingType } from "./${source}"`,
          parser: parser,
          settings: settings,
          errors: [{
            message: `MissingType not found in './${source}'`,
            type: 'Identifier',
          }],
        }),
        test({
          code: `import { NotExported } from "./${source}"`,
          parser: parser,
          settings: settings,
          errors: [{
            message: `NotExported not found in './${source}'`,
            type: 'Identifier',
          }],
        }),
      );
    });
  });
});
