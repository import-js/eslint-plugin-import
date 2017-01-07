import { test, SYNTAX_CASES } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-anonymous-default-export')

ruleTester.run('no-anonymous-default-export', rule, {
    valid: [
      // Exports with identifiers are valid
      test({ code: 'const foo = 123\nexport default foo' }),
      test({ code: 'export default function foo() {}'}),
      test({ code: 'export default class MyClass {}'}),

      // Allow each forbidden type with appropriate option
      test({ code: 'export default []', options: [{ allowArray: true }] }),
      test({ code: 'export default () => {}', options: [{ allowArrowFunction: true }] }),
      test({ code: 'export default class {}', options: [{ allowAnonymousClass: true }] }),
      test({ code: 'export default function() {}', options: [{ allowAnonymousFunction: true }] }),
      test({ code: 'export default 123', options: [{ allowLiteral: true }] }),
      test({ code: 'export default \'foo\'', options: [{ allowLiteral: true }] }),
      test({ code: 'export default `foo`', options: [{ allowLiteral: true }] }),
      test({ code: 'export default {}', options: [{ allowObject: true }] }),

      // Allow forbidden types with multiple options
      test({ code: 'export default 123', options: [{ allowLiteral: true, allowObject: true }] }),
      test({ code: 'export default {}', options: [{ allowLiteral: true, allowObject: true }] }),

      // Sanity check unrelated export syntaxes
      test({ code: 'export * from \'foo\'' }),
      test({ code: 'const foo = 123\nexport { foo }' }),
      test({ code: 'const foo = 123\nexport { foo as default }' }),

      ...SYNTAX_CASES,
    ],

    invalid: [
      test({ code: 'export default []', errors: [{ message: 'Assign array to a variable before exporting as module default' }] }),
      test({ code: 'export default () => {}', errors: [{ message: 'Assign arrow function to a variable before exporting as module default' }] }),
      test({ code: 'export default class {}', errors: [{ message: 'Unexpected default export of anonymous class' }] }),
      test({ code: 'export default function() {}', errors: [{ message: 'Unexpected default export of anonymous function' }] }),
      test({ code: 'export default 123', errors: [{ message: 'Assign literal to a variable before exporting as module default' }] }),
      test({ code: 'export default \'foo\'', errors: [{ message: 'Assign literal to a variable before exporting as module default' }] }),
      test({ code: 'export default `foo`', errors: [{ message: 'Assign literal to a variable before exporting as module default' }] }),
      test({ code: 'export default {}', errors: [{ message: 'Assign object to a variable before exporting as module default' }] }),

      // Test failure with non-covering exception
      test({ code: 'export default 123', options: [{ allowObject: true }], errors: [{ message: 'Assign literal to a variable before exporting as module default' }] }),
    ],
})
