import { test } from '../utils'
import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('../../../lib/rules/named')

function error(name, module) {
  return { message: name + ' not found in \'' + module + '\''
         , type: 'Identifier' }
}

ruleTester.run('named', rule, {
  valid: [
    test({code: 'import { foo } from "./bar"'}),
    test({code: 'import { foo } from "./empty-module"'}),
    test({code: 'import bar from "./bar.js"'}),
    test({code: 'import bar, { foo } from "./bar.js"'}),
    test({code: 'import {a, b, d} from "./named-exports"'}),
    test({code: 'import {ExportedClass} from "./named-exports"'}),
    test({code: 'import { ActionTypes } from "./qc"'}),
    test({code: 'import {a, b, c, d} from "./re-export"'}),

    test({ code: 'import { jsxFoo } from "./jsx/AnotherComponent"'
         , settings: { 'import/resolve': { 'extensions': ['.js', '.jsx'] } }
         }),

    // validate that eslint-disable-line silences this properly
    test({code: 'import {a, b, d} from "./common"; ' +
                '// eslint-disable-line named' }),

    test({ code: 'import {foo, bar} from "./re-export-names"'
         , args: [2, 'es6-only']}),

    test({ code: 'import { foo, bar } from "./common"'
         , settings: { 'import/ignore': ['common'] }
         }),
    test({ code: 'import { baz } from "./bar"'
         , settings: { 'import/ignore': ['bar'] }
         }),

    // ignore core modules by default
    test({ code: 'import { foo } from "crypto"' }),
    test({ code: 'import { zoob } from "a"' }),

    test({ code: 'import { someThing } from "./module"' })

    // node_modules/a only exports 'foo', should be ignored though
  , test({ code: 'import { zoob } from "a"' })

    // parses / correctly verifies if settings remove node_modules
    // from ignore list
  , test({ code: 'import { foo } from "a"'
         , settings: { 'import/ignore': [] }
         })

    // export tests
  , test({ code: 'export { foo } from "./bar"' })
  , test({ code: 'export { foo as bar } from "./bar"' })
  , test({ code: 'export { foo } from "./does-not-exist"' })

    // es7
  , test({ code: 'export bar, { foo } from "./bar"'
         , parser: 'babel-eslint'
         })
  , test({ code: 'import { foo, bar } from "./named-trampoline"'
         , settings: { 'import/parse-options': { plugins: ['exportExtensions'] }}
         })

    // regression tests
  , test({ code: 'export { foo as bar }'})
  ],

  invalid: [

    test({ code: 'import { zoob } from "a"'
         , settings: { 'import/ignore': [] }
         , errors: [ error('zoob', 'a') ]
         }),

    test({ code: 'import { somethingElse } from "./module"'
         , errors: [ error('somethingElse', './module') ]
         }),

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

    test({code: 'import { a } from "./re-export-names"',
      args: [2, 'es6-only'],
        errors: [error('a', './re-export-names')]})

    // export tests
  , test({ code: 'export { bar } from "./bar"'
         , errors: 1
         })

    // es7
  , test({ code: 'export bar2, { bar } from "./bar"'
         , parser: 'babel-eslint'
         , errors: 1
         })
  , test({ code: 'import { foo, bar, baz } from "./named-trampoline"'
         , settings: { 'import/parse-options': { plugins: ['exportExtensions']}}
         , errors: 1
         })
  , test({ code: 'import { baz } from "./broken-trampoline"'
         , settings: { 'import/parse-options': { plugins: ['exportExtensions']}}
         , errors: 1
         })
  ]
})
