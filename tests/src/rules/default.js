import { test, SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve'

var ruleTester = new RuleTester()
  , rule = require('rules/default')

ruleTester.run('default', rule, {
  valid: [
    test({ code: 'import "./malformed.js"' }),

    test({code: 'import foo from "./empty-folder";'}),
    test({code: 'import { foo } from "./default-export";'}),
    test({code: 'import foo from "./default-export";'}),
    test({code: 'import foo from "./mixed-exports";'}),
    test({
      code: 'import bar from "./default-export";'}),
    test({
      code: 'import CoolClass from "./default-class";'}),
    test({
      code: 'import bar, { baz } from "./default-export";'}),

    // core modules always have a default
    test({ code: 'import crypto from "crypto";' }),

    test({ code: 'import common from "./common";' }),

    // es7 export syntax
    test({ code: 'export bar from "./bar"'
         , parser: 'babel-eslint' }),
    test({ code: 'export { default as bar } from "./bar"' }),
    test({ code: 'export bar, { foo } from "./bar"'
         , parser: 'babel-eslint' }),
    test({ code: 'export { default as bar, foo } from "./bar"' }),
    test({ code: 'export bar, * as names from "./bar"'
         , parser: 'babel-eslint' }),

    // sanity check
    test({ code: 'export {a} from "./named-exports"' }),
    test({
      code: 'import twofer from "./trampoline"',
      parser: 'babel-eslint',
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
      parser: 'babel-eslint',
    }),

    // #545: more ES7 cases
    test({
      code: "import bar from './default-export-from.js';",
      parser: 'babel-eslint',
    }),
    test({
      code: "import bar from './default-export-from-named.js';",
      parser: 'babel-eslint',
    }),
    test({
      code: "import bar from './default-export-from-ignored.js';",
      settings: { 'import/ignore': ['common'] },
      parser: 'babel-eslint',
    }),
    test({
      code: "export bar from './default-export-from-ignored.js';",
      settings: { 'import/ignore': ['common'] },
      parser: 'babel-eslint',
    }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    test({
      code: "import Foo from './jsx/FooES7.js';",
      errors: ["Parse errors in imported module './jsx/FooES7.js': Unexpected token = (6:16)"],
    }),

    test({
      code: 'import baz from "./named-exports";',
      errors: [{ message: 'No default export found in module.'
               , type: 'ImportDefaultSpecifier'}]}),

    test({
      code: "import Foo from './jsx/FooES7.js';",
      errors: ["Parse errors in imported module './jsx/FooES7.js': Unexpected token = (6:16)"],
    }),

    // es7 export syntax
    test({
      code: 'export baz from "./named-exports"',
      parser: 'babel-eslint',
      errors: ['No default export found in module.'],
    }),
    test({
      code: 'export baz, { bar } from "./named-exports"',
      parser: 'babel-eslint',
      errors: ['No default export found in module.'],
    }),
    test({
      code: 'export baz, * as names from "./named-exports"',
      parser: 'babel-eslint',
      errors: ['No default export found in module.'],
    }),
    // exports default from a module with no default
    test({
      code: 'import twofer from "./broken-trampoline"',
      parser: 'babel-eslint',
      errors: ['No default export found in module.'],
    }),

    // #328: * exports do not include default
    test({
      code: 'import barDefault from "./re-export"',
      errors: [`No default export found in module.`],
    }),
  ],
})

// #311: import of mismatched case
if (!CASE_SENSITIVE_FS) {
  ruleTester.run('default (path case-insensitivity)', rule, {
    valid: [
      test({
        code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
      }),
    ],
    invalid: [
      test({
        code: 'import bar from "./Named-Exports"',
        errors: ['No default export found in module.'],
      }),
    ],
  })
}
