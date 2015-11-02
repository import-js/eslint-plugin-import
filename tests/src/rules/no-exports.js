import { test } from '../utils'
import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('../../../lib/rules/no-commonjs-exports')

ruleTester.run('no-commonjs-exports', rule, {
  valid: [
    test({ code: 'export { foo }' }),
    // module-level definition is fine
    test({ code: "const exports = {}; exports.x = 'y'" }),
    // scoped redefinition is fine
    test({ code: "define(function (exports) { exports.x = 'y'; });" }),
  ],

  invalid: [
    test({ code: 'exports.foo = "bar"', errors: 1 }),
    test({ code: 'module.exports = { foo: "bar" }', errors: 1 }),
    test({ code: 'module.exports = function foo() { return "bar" }'
         , errors: 1 }),
  ],
})
