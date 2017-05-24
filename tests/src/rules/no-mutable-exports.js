import {test} from '../utils'
import {RuleTester} from 'eslint'
import rule from 'rules/no-mutable-exports'

const ruleTester = new RuleTester()

ruleTester.run('no-mutable-exports', rule, {
  valid: [
    test({ code: 'export const count = 1'}),
    test({ code: 'export function getCount() {}'}),
    test({ code: 'export class Counter {}'}),
    test({ code: 'export default count = 1'}),
    test({ code: 'export default function getCount() {}'}),
    test({ code: 'export default class Counter {}'}),
    test({ code: 'const count = 1\nexport { count }'}),
    test({ code: 'const count = 1\nexport { count as counter }'}),
    test({ code: 'const count = 1\nexport default count'}),
    test({ code: 'const count = 1\nexport { count as default }'}),
    test({ code: 'function getCount() {}\nexport { getCount }'}),
    test({ code: 'function getCount() {}\nexport { getCount as getCounter }'}),
    test({ code: 'function getCount() {}\nexport default getCount'}),
    test({ code: 'function getCount() {}\nexport { getCount as default }'}),
    test({ code: 'class Counter {}\nexport { Counter }'}),
    test({ code: 'class Counter {}\nexport { Counter as Count }'}),
    test({ code: 'class Counter {}\nexport default Counter'}),
    test({ code: 'class Counter {}\nexport { Counter as default }'}),
    test({
      parser: 'babel-eslint',
      code: 'export Something from "./something";',
    }),
    test({
      parser: 'babel-eslint',
      code: 'type Foo = {}\nexport type {Foo}',
    }),
  ],
  invalid: [
    test({
      code: 'export let count = 1',
      errors: ['Exporting mutable \'let\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'export var count = 1',
      errors: ['Exporting mutable \'var\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'let count = 1\nexport { count }',
      errors: ['Exporting mutable \'let\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'var count = 1\nexport { count }',
      errors: ['Exporting mutable \'var\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'let count = 1\nexport { count as counter }',
      errors: ['Exporting mutable \'let\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'var count = 1\nexport { count as counter }',
      errors: ['Exporting mutable \'var\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'let count = 1\nexport default count',
      errors: ['Exporting mutable \'let\' binding, use \'const\' instead.'],
    }),
    test({
      code: 'var count = 1\nexport default count',
      errors: ['Exporting mutable \'var\' binding, use \'const\' instead.'],
    }),

    // todo: undeclared globals
    // test({
    //   code: 'count = 1\nexport { count }',
    //   errors: ['Exporting mutable global binding, use \'const\' instead.'],
    // }),
    // test({
    //   code: 'count = 1\nexport default count',
    //   errors: ['Exporting mutable global binding, use \'const\' instead.'],
    // }),
  ],
})
