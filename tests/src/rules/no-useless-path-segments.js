import { test } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-useless-path-segments')

function runResolverTests(resolver) {
  ruleTester.run(`no-useless-path-segments (${resolver})`, rule, {
    valid: [
      test({ code: 'import "./malformed.js"' }),
      test({ code: 'import "./test-module"' }),
      test({ code: 'import fs from "fs"' }),
    ],

    invalid: [
      test({
        code: 'import "./../files/malformed.js"',
        errors: [ 'Useless path segments for "./../files/malformed.js", should be "./malformed.js"'],
      }),
      test({
        code: 'import "./../files/malformed"',
        errors: [ 'Useless path segments for "./../files/malformed", should be "./malformed"'],
      }),
     ],
   })
}

['node', 'webpack'].forEach(runResolverTests)
