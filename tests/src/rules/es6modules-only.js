import * as path from 'path'

import { test, SYNTAX_CASES } from '../utils'

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve'

import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('rules/es6modules-only')
  , settings = {
    'import/resolve': {
      'paths': [path.join( process.cwd(), 'tests', 'files')],
    },
  }

  ruleTester.run('es6modules-only', rule, {
    valid: [
      test({ code: 'import defaultExport from "./default-export"', settings }),
      test({ code: 'import defaultClass from "./default-class"', settings }),
      test({ code: 'import {ExportedClass} from "./named-exports"', settings }),
      test({ code: 'import all from "./export-all"', settings }),

      test({ 
        code: 'import common from "./common-module"',
        settings,
        options: [ { ignore: ['./common-module'] } ],
      }),

      test({ 
        code: 'const defaultExport = require("./default-export")',
        settings,
        options: [{ commonjs: true }],
      }),
      test({
        code: 'const defaultClass = require("./default-class")',
        settings,
        options: [{ commonjs: true }],
      }),
      test({
        code: 'const {ExportedClass} = require("./named-exports")',
        settings,
        options: [{ commonjs: true }],
      }),
      test({ 
        code: 'const all = require("./export-all")',
        settings,
        options: [{ commonjs: true }],
      }),
    ],
    invalid: [
      test({ 
        code: 'import umd from "./umd"', 
        settings,
        errors: [{ message: 'Not an ES6 module \'./umd\'.'
        , type: 'Literal' }],
      }),
      test({ 
        code: 'import common from "./common-module"', 
        settings,
        errors: [{ message: 'Not an ES6 module \'./common-module\'.'
        , type: 'Literal' }],
      }),
      test({ 
        code: 'import common from "./nonexisted-module"', 
        settings,
        errors: [{ message: 'Not possible to check \'./nonexisted-module\'.'
        , type: 'Literal' }],
      }),

      test({ 
        code: 'const umd = require("./umd")', 
        settings,
        options: [{ commonjs: true }],
        errors: [{ message: 'Not an ES6 module \'./umd\'.'
        , type: 'Literal' }],
      }),
      test({ 
        code: 'const common = require("./common-module")', 
        settings,
        options: [{ commonjs: true }],
        errors: [{ message: 'Not an ES6 module \'./common-module\'.'
        , type: 'Literal' }],
      }),
      test({ 
        code: 'const common = require("./nonexisted-module")', 
        settings,
        options: [{ commonjs: true }],
        errors: [{ message: 'Not possible to check \'./nonexisted-module\'.'
        , type: 'Literal' }],
      }),
    ],
  })