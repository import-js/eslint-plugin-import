import {test} from '../utils'
import {RuleTester} from 'eslint'
import rule from 'rules/no-mutable-exports'

const ruleTester = new RuleTester()

ruleTester.run('no-mutable-exports', rule, {
  valid: [
    test({ code: 'export const count = 1'}),
    test({ code: 'export function getCount() {}'}),
    test({ code: 'export class Counter {}'}),
  ],
  invalid: [
    test({
      code: 'export let count = 1',
      errors: ['Exporting mutable \'let\' binding, use const instead.'],
    }),
    test({
      code: 'export var count = 1',
      errors: ['Exporting mutable \'var\' binding, use const instead.'],
    }),
  ],
})
