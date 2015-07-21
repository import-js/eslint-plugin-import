var path = require('path')

var test = require('../../utils').test

var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

eslintTester.addRuleTest('lib/rules/no-unresolved', {
  valid: [
    test({ code: 'import foo from "./bar";' }),
    test({ code: "import bar from './bar.js';" }),
    test({ code: "import {someThing} from './module';" }),
    test({ code: "import fs from 'fs';" }),

    test({
      code: "import { DEEP } from 'in-alternate-root';",
      settings: {
        'import/resolve': {
          'paths': [path.join( process.cwd()
                             , 'tests', 'files', 'alternate-root')]
        }
      }
    }),
    test({
      code: "import { DEEP } from 'in-alternate-root'; " +
            "import { bar } from 'src-bar';",
      settings: {'import/resolve': { 'paths': [
        path.join('tests', 'files', 'src-root'),
        path.join('tests', 'files', 'alternate-root')
      ]}}}),

    test({ code: 'import * as foo from "a"' }),

    test({ code: 'import * as foo from "jsx-module/foo"'
         , settings: { 'import/resolve': { 'extensions': ['.jsx'] } }
         })

  , test({ code: 'export { foo } from "./bar"' })
  , test({ code: 'export * from "./bar"' })
  , test({ code: 'export { foo }' })

    // stage 1 proposal for export symmetry
  , test({ code: 'export * as bar from "./bar"'
         , parser: 'babel-eslint'
         })
  , test({ code: 'export bar from "./bar"'
         , parser: 'babel-eslint'
         })
  ],

  invalid: [
    // should fail for jsx by default
    test({ code: 'import * as foo from "jsx-module/foo"'
         , errors: [ {message: 'Unable to resolve path to ' +
                               'module \'jsx-module/foo\'.'} ]
         }),


    test({ code: 'import reallyfake from "./reallyfake/module"'
         , settings: { 'import/ignore': ['^\\./fake/'] }
         , errors: [ 'Unable to resolve path to module \'fake/module\'.' ]
         }),


    test({
      code: "import bar from './baz';",
      errors: [{ message: "Unable to resolve path to module './baz'."
               , type: 'Literal'
               }]}),
    test({ code: "import bar from './baz';"
         , errors: [{ message: "Unable to resolve path to module './baz'."
                    , type: 'Literal'
                    }]
         }),
    test({
      code: "import bar from './empty-folder';",
      errors: [{ message: "Unable to resolve path to module './empty-folder'."
               , type: 'Literal'
               }]}),

    // sanity check that this module is _not_ found without proper settings
    test({
      code: "import { DEEP } from 'in-alternate-root';",
      errors: [{ message: 'Unable to resolve path to ' +
                          "module 'in-alternate-root'."
               , type: 'Literal'
               }]})

  , test({ code: 'export { foo } from "./does-not-exist"'
         , errors: 1
         })
  , test({ code: 'export * from "./does-not-exist"'
         , errors: 1
         })

    // export symmetry proposal
  , test({ code: 'export * as bar from "./does-not-exist"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  , test({ code: 'export bar from "./does-not-exist"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  ]
})
