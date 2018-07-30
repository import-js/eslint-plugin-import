import { test, testFilePath } from '../utils'

import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
    , rule = require('rules/no-unused-modules')

const error = message => ({ ruleId: 'no-unused-modules', message })

const missingExportsOptions = [{
  missingExports: true,
}]

const unusedExportsOptions = [{
  unusedExports: true,
  src: [testFilePath('./no-unused-modules/**/*.js')],
  ignore: [testFilePath('./no-unused-modules/*ignored*.js')],
}]

// tests for missing exports
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: missingExportsOptions,
           code: 'export default () => 1'}),
    test({ options: missingExportsOptions,
           code: 'export const a = 1'}),
    test({ options: missingExportsOptions,
           code: 'const a = 1; export { a }'}),
    test({ options: missingExportsOptions,
           code: 'function a() { return true }; export { a }'}),
    test({ options: missingExportsOptions,
           code: 'const a = 1; const b = 2; export { a, b }'}),
    test({ options: missingExportsOptions,
           code: 'const a = 1; export default a'}),
  ],
  invalid: [
    test({
      options: missingExportsOptions,
      code: 'const a = 1',
      errors: [error(`No exports found`)],
    }),
  ],
})


// tests for unused exports
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
      code: 'export default () => 1',
      filename: testFilePath('./no-unused-modules/file-a.js')}),
    test({ options: unusedExportsOptions,
      code: 'export const b = 2',
      filename: testFilePath('./no-unused-modules/file-b.js')}),
    test({ options: unusedExportsOptions,
      code: 'const c1 = 3; function c2() { return 3 }; export { c1, c2 }',
      filename: testFilePath('./no-unused-modules/file-c.js')}),
    test({ options: unusedExportsOptions,
      code: 'export function d() { return 4 }',
      filename: testFilePath('./no-unused-modules/file-d.js')}),
    test({ options: unusedExportsOptions,
      code: 'const e0 = 5; export { e0 as e }',
      filename: testFilePath('./no-unused-modules/file-e.js')}),
    ],
  invalid: [],
})

// test for unused exports
ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export default () => 1',
           filename: testFilePath('./no-unused-modules/file-f.js'),
          errors: [error(`exported declaration 'default' not used within other modules`)]}),
    test({ options: unusedExportsOptions,
           code: 'export const g = 2',
           filename: testFilePath('./no-unused-modules/file-g.js'),
           errors: [error(`exported declaration 'g' not used within other modules`)]}),
    test({ options: unusedExportsOptions,
           code: 'const h1 = 3; function h2() { return 3 }; export { h1, h2 }',
           filename: testFilePath('./no-unused-modules/file-h.js'),
           errors: [error(`exported declaration 'h1' not used within other modules`)]}),
    test({ options: unusedExportsOptions,
           code: 'const i1 = 3; function i2() { return 3 }; export { i1, i2 }',
           filename: testFilePath('./no-unused-modules/file-i.js'),
           errors: [
             error(`exported declaration 'i1' not used within other modules`),
             error(`exported declaration 'i2' not used within other modules`),
           ]}),
    test({ options: unusedExportsOptions,
           code: 'export function j() { return 4 }',
           filename: testFilePath('./no-unused-modules/file-j.js'),
           errors: [error(`exported declaration 'j' not used within other modules`)]}),
    test({ options: unusedExportsOptions,
           code: 'const k0 = 5; export { k0 as k }',
           filename: testFilePath('./no-unused-modules/file-k.js'),
           errors: [error(`exported declaration 'k' not used within other modules`)]}),
  ],
})

// test for ignored files
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
      code: 'export default () => 1',
      filename: testFilePath('./no-unused-modules/file-ignored-a.js')}),
    test({ options: unusedExportsOptions,
      code: 'export const b = 2',
      filename: testFilePath('./no-unused-modules/file-ignored-b.js')}),
    test({ options: unusedExportsOptions,
      code: 'const c1 = 3; function c2() { return 3 }; export { c1, c2 }',
      filename: testFilePath('./no-unused-modules/file-ignored-c.js')}),
    test({ options: unusedExportsOptions,
      code: 'export function d() { return 4 }',
      filename: testFilePath('./no-unused-modules/file-ignored-d.js')}),
    test({ options: unusedExportsOptions,
      code: 'const f = 5; export { f as e }',
      filename: testFilePath('./no-unused-modules/file-ignored-e.js')})],
  invalid: [],
})

// add named import for file with default export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
      code: `import { j } from '${testFilePath('./no-unused-modules/file-f.js')}'`,
      filename: testFilePath('./no-unused-modules/file-0.js')}),
    ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export default () => 1',
           filename: testFilePath('./no-unused-modules/file-f.js'),
          errors: [error(`exported declaration 'default' not used within other modules`)]}),
    ],
})

// add default import for file with default export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import f from '${testFilePath('./no-unused-modules/file-f.js')}'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
    test({ options: unusedExportsOptions,
           code: 'export default () => 1',
           filename: testFilePath('./no-unused-modules/file-f.js')}),
    ],
  invalid: [],
})

// add default import for file with named export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import g from '${testFilePath('./no-unused-modules/file-g.js')}'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
    ],
  invalid: [
    test({ options: unusedExportsOptions,
            code: 'export const g = 2',
            filename: testFilePath('./no-unused-modules/file-g.js'),
            errors: [error(`exported declaration 'g' not used within other modules`)]})],
})

// add named import for file with named export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import { g } from '${testFilePath('./no-unused-modules/file-g.js')}'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
    test({ options: unusedExportsOptions,
            code: 'export const g = 2',
            filename: testFilePath('./no-unused-modules/file-g.js')}),
    ],
  invalid: [],
})

// add different named import for file with named export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import { c } from '${testFilePath('./no-unused-modules/file-b.js')}'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
  ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export const b = 2',
           filename: testFilePath('./no-unused-modules/file-b.js'),
           errors: [error(`exported declaration 'b' not used within other modules`)]}),
  ],
})

// remove default import for file with default export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import { a1, a2 } from '${testFilePath('./no-unused-modules/file-a.js')}'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
  ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export default () => 1',
           filename: testFilePath('./no-unused-modules/file-a.js'),
           errors: [error(`exported declaration 'default' not used within other modules`)]}),
  ],
})