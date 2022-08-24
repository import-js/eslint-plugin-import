import path from 'path';
import { test, testVersion, SYNTAX_CASES, getTSParsers } from '../utils';
import  parsers  from '../parsers';
import { RuleTester } from 'eslint';
import semver from 'semver';
import { version as tsEslintVersion } from 'typescript-eslint-parser/package.json';
import fromEntries from 'object.fromentries';

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve';

const rule = require('rules/default');

const parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true,
  },
  settings: {
    'import/parsers': fromEntries(getTSParsers().map((parser) => [parser, ['.ts']])),
  },
};

const ruleTester = new RuleTester({ parserOptions });

ruleTester.run('default', rule, {
  valid: parsers.all([].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import foo from "./empty-folder";' }),
    test({ code: 'import { foo } from "./default-export";' }),
    test({ code: 'import foo from "./default-export";' }),
    test({ code: 'import foo from "./mixed-exports";' }),
    test({ code: 'import bar from "./default-export";' }),
    test({ code: 'import CoolClass from "./default-class";' }),
    test({ code: 'import bar, { baz } from "./default-export";' }),

    // core modules always have a default
    test({ code: 'import crypto from "crypto";' }),

    test({ code: 'import common from "./common";' }),

    // es7 export syntax
    test({
      code: 'export bar from "./bar"',
      features: ['export-default-from'],
    }),
    test({ code: 'export { default as bar } from "./bar"' }),
    test({
      code: 'export bar, { foo } from "./bar"',
      features: ['export-default-from'],
    }),
    test({ code: 'export { default as bar, foo } from "./bar"' }),
    test({
      code: 'export bar, * as names from "./bar"',
      features: ['export-default-from'],
    }),

    // sanity check
    test({ code: 'export {a} from "./named-exports"' }),
    test({
      code: 'import twofer from "./trampoline"',
      features: ['export-default-from'],
    }),

    // jsx
    test({
      code: 'import MyCoolComponent from "./jsx/MyCoolComponent.jsx"',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 6,
        ecmaFeatures: { jsx: true },
      },
    }),

    // #54: import of named export default
    test({ code: 'import foo from "./named-default-export"' }),

    // #94: redux export of execution result,
    test({ code: 'import connectedApp from "./redux"' }),
    test({
      code: 'import App from "./jsx/App"',
      parserOptions: {
        ecmaFeatures: { jsx: true, modules: true },
      },
    }),

    // from no-errors
    test({
      code: "import Foo from './jsx/FooES7.js';",
      features : ['class fields', 'types', 'no-ts-old'],
    }),

    // #545: more ES7 cases
    test({
      code: "import bar from './default-export-from.js';",
      features: ['default-export-from', 'no-default', 'no-ts'],
    }),
    test({ code: "import bar from './default-export-from-named.js';" }),
    test({
      code: "import bar from './default-export-from-ignored.js';",
      settings: { 'import/ignore': ['common'] },
    }),
    test({
      code: "export bar from './default-export-from-ignored.js';",
      features: ['export-default-from'],
      settings: { 'import/ignore': ['common'] },
    }),

    //typescript context
    test({
      code: `import foobar from "./typescript-default"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      //feature
      //features: ['ts'],
    }),
    test({
      code: `import foobar from "./typescript-export-assign-default"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    test({
      code: `import foobar from "./typescript-export-assign-function"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),
    semver.satisfies(tsEslintVersion, '>= 22') ? test({
      code: `import foobar from "./typescript-export-assign-mixed"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }) : [],
    test({
      code: `import foobar from "./typescript-export-assign-default-reexport"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),

    test({
      code: `import React from "./typescript-export-assign-default-namespace"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-assign-default-namespace/'),
      },
    }),

    test({
      code: `import Foo from "./typescript-export-as-default-namespace"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-assign-default-namespace/'),
      },
    }),

    test({
      code: `import Foo from "./typescript-export-react-test-renderer"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-export-react-test-renderer/'),
      },
    }),
    test({
      code: `import Foo from "./typescript-extended-config"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-extended-config/'),
      },
    }),
    test({

      code: `import foobar from "./typescript-export-assign-property"`,
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }),

    testVersion('>= 8.7', () => ({
      code: 'export { "default" as bar } from "./bar"',
      features: ['arbitrary-export-names'],
      parserOptions: {
        ecmaVersion: 2022,
      },
    })),


    // #311: import of mismatched case
    CASE_SENSITIVE_FS ? [] : test({
      code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
    }),

    SYNTAX_CASES,
  )),

  invalid: parsers.all([].concat(
    test({
      code: "import Foo from './jsx/FooES7.js';",
      features: ['ts', 'no-ts-new'],
      errors: ["Parse errors in imported module './jsx/FooES7.js': Unexpected token = (6:16)"],
    }),

    test({
      code: 'import baz from "./named-exports";',
      errors: [{ message: 'No default export found in imported module "./named-exports".',
        type: 'ImportDefaultSpecifier' }] }),

    // es7 export syntax
    test({
      code: 'export baz from "./named-exports"',
      features: ['export-default-from'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    test({
      code: 'export baz, { bar } from "./named-exports"',
      features: ['export-default-from'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    test({
      code: 'export baz, * as names from "./named-exports"',
      features: ['export-default-from'],
      errors: ['No default export found in imported module "./named-exports".'],
    }),
    // exports default from a module with no default
    test({
      code: 'import twofer from "./broken-trampoline"',
      features: ['export-default-from'],
      errors: ['No default export found in imported module "./broken-trampoline".'],
    }),

    // #328: * exports do not include default
    test({
      code: 'import barDefault from "./re-export"',
      errors: ['No default export found in imported module "./re-export".'],
    }),

    test({
      code: `import foobar from "./typescript"`,
      features: ['ts'],
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      errors: ['No default export found in imported module "./typescript".'],
    }),
    test({
      code: `import React from "./typescript-export-assign-default-namespace"`,
      features: ['ts'],
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      errors: ['No default export found in imported module "./typescript-export-assign-default-namespace".'],
    }),
    test({
      code: `import FooBar from "./typescript-export-as-default-namespace"`,
      features: ['ts'],
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      errors: ['No default export found in imported module "./typescript-export-as-default-namespace".'],
    }),
    test({
      code: `import Foo from "./typescript-export-as-default-namespace"`,
      features: ['ts'],
      settings: {
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
      parserOptions: {
        tsconfigRootDir: path.resolve(__dirname, '../../files/typescript-no-compiler-options/'),
      },
      errors: [
        {
          message: 'No default export found in imported module "./typescript-export-as-default-namespace".',
          line: 1,
          column: 8,
          endLine: 1,
          endColumn: 11,
        },
      ],
    }),

    // #311: import of mismatched case
    CASE_SENSITIVE_FS ? [] : test({
      code: 'import bar from "./Named-Exports"',
      errors: ['No default export found in imported module "./Named-Exports".'],
    }),
  )),
});
