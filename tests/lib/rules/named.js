'use strict'

var linter = require('eslint').linter,
    ESLintTester = require('eslint-tester')

var eslintTester = new ESLintTester(linter)

var test = require('../../utils').test

function error(name, module) {
  return { message: name + ' not found in \'' + module + '\''
         , type: 'Identifier' }
}


eslintTester.addRuleTest('lib/rules/named', {
  valid: [
    test({code: 'import { foo } from "./bar"'}),
    test({code: 'import { foo } from "./empty-module"'}),
    test({code: 'import bar from "./bar.js"'}),
    test({code: 'import bar, { foo } from "./bar.js"'}),
    test({code: 'import {a, b, d} from "./named-exports"'}),
    test({code: 'import {ExportedClass} from "./named-exports"'}),
    test({code: 'import { ActionTypes } from "./qc"'}),
    test({code: 'import {a, b, c, d} from "./re-export"'}),

    // validate that eslint-disable-line silences this properly
    test({code: 'import {a, b, d} from "./common"; ' +
                '// eslint-disable-line named' }),

    test({ code: 'import {foo, bar} from "./re-export-names"'
         , args: [2, 'es6-only']}),

    test({ code: 'import { foo, bar } from "./common"'
         , settings: { 'import.ignore': ['/common'] }
         }),
    test({ code: 'import { baz } from "./bar"'
         , settings: { 'import.ignore': ['/bar'] }
         }),

    // ignore node modules by default
    test({ code: 'import { foo } from "crypto"' })
  ],

  invalid: [
    test({ code: 'import { foo } from "crypto"'
         , args: [2, 'all']
         , errors: [ error('foo', 'crypto') ]}),
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
  ]
})
