import { test, testFilePath } from '../utils'

import { RuleTester } from 'eslint'
import { expect } from 'chai'
import fs from 'fs'

const ruleTester = new RuleTester()
    , rule = require('rules/no-unused-modules')

const error = message => ({ ruleId: 'no-unused-modules', message })

const missingExportsOptions = [{
  missingExports: true,
}]

const unusedExportsOptions = [{
  unusedExports: true,
  src: [testFilePath('./no-unused-modules/**/*.js')],
  ignoreExports: [testFilePath('./no-unused-modules/*ignored*.js')],
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
    test({
      options: missingExportsOptions,
      code: '/* const a = 1 */',
      errors: [error(`No exports found`)],
    }),
  ],
})


// tests for  exports
ruleTester.run('no-unused-modules', rule, {
  valid: [

    test({ options: unusedExportsOptions,
           code: 'import { o2 } from "./file-o";export default () => 12',
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
    test({ options: unusedExportsOptions,
           code: 'const l0 = 5; const l = 10; export { l0 as l1, l }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-l.js')}),
    test({ options: unusedExportsOptions,
           code: 'const o0 = 0; const o1 = 1; export { o0, o1 as o2 }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-o.js')}),
    ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: `import eslint from 'eslint'
           import fileA from './file-a'
           import { b } from './file-b'
           import { c1, c2 } from './file-c'
           import { d } from './file-d'
           import { e } from './file-e'
           import { e2 } from './file-e'
           import { h2 } from './file-h'
           import * as l from './file-l'
           export * from './file-n'
           export { default, o0, o3 } from './file-o'
           export { p } from './file-p'`,
           filename: testFilePath('./no-unused-modules/file-0.js'),
           errors: [
             error(`exported declaration 'default' not used within other modules`),
             error(`exported declaration 'o0' not used within other modules`),
             error(`exported declaration 'o3' not used within other modules`),
             error(`exported declaration 'p' not used within other modules`),
           ]}),
    test({ options: unusedExportsOptions,
           code: `const n0 = 'n0'; const n1 = 42; export { n0, n1 }; export default () => {}`,
           filename: testFilePath('./no-unused-modules/file-n.js'),
           errors: [error(`exported declaration 'default' not used within other modules`)]}),
  ],
})

// test for unused exports
ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export default () => 13',
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

// // test for export from 
ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: `export { k } from '${testFilePath('./no-unused-modules/file-k.js')}'`,
           filename: testFilePath('./no-unused-modules/file-j.js'),
           errors: [error(`exported declaration 'k' not used within other modules`)]}),
  ],
})

ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: 'const k0 = 5; export { k0 as k }',
           filename: testFilePath('./no-unused-modules/file-k.js')}),
  ],
  invalid: [],
})

// test for ignored files
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
      code: 'export default () => 14',
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
      filename: testFilePath('./no-unused-modules/file-ignored-e.js')}),
    test({ options: unusedExportsOptions,
      code: 'const l0 = 5; const l = 10; export { l0 as l1, l }; export default () => {}',
      filename: testFilePath('./no-unused-modules/file-ignored-l.js')}),
    ],
  invalid: [],
})

// add named import for file with default export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
      code: `import { f } from '${testFilePath('./no-unused-modules/file-f.js')}'`,
      filename: testFilePath('./no-unused-modules/file-0.js')}),
    ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'export default () => 15',
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
           code: 'export default () => 16',
           filename: testFilePath('./no-unused-modules/file-f.js')}),
    ],
  invalid: [],
})

// add default import for file with named export
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import g from '${testFilePath('./no-unused-modules/file-g.js')}';import {h} from '${testFilePath('./no-unused-modules/file-gg.js')}'`,
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
           code: `import { g } from '${testFilePath('./no-unused-modules/file-g.js')}'; import eslint from 'eslint'`,
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
           code: 'export default () => 17',
           filename: testFilePath('./no-unused-modules/file-a.js'),
           errors: [error(`exported declaration 'default' not used within other modules`)]}),
  ],
})

// add namespace import for file with unused exports
ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-m.js'),
           errors: [
             error(`exported declaration 'm1' not used within other modules`),
             error(`exported declaration 'm' not used within other modules`),
             error(`exported declaration 'default' not used within other modules`),
          ]}),
  ],
})
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `import * as m from '${testFilePath('./no-unused-modules/file-m.js')}'; import unknown from 'unknown-module'`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
    test({ options: unusedExportsOptions,
           code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-m.js')}),
  ],
  invalid: [],
})

// remove all exports
ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `/* import * as m from '${testFilePath('./no-unused-modules/file-m.js')}' */`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
  ],
  invalid: [
    test({ options: unusedExportsOptions,
      code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
      filename: testFilePath('./no-unused-modules/file-m.js'),
      errors: [
        error(`exported declaration 'm1' not used within other modules`),
        error(`exported declaration 'm' not used within other modules`),
        error(`exported declaration 'default' not used within other modules`),
     ]}),
  ],
})

ruleTester.run('no-unused-modules', rule, {
  valid: [
    test({ options: unusedExportsOptions,
           code: `export * from '${testFilePath('./no-unused-modules/file-m.js')}';`,
           filename: testFilePath('./no-unused-modules/file-0.js')}),
  ],
  invalid: [],
})
ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-m.js'),
           errors: [error(`exported declaration 'default' not used within other modules`)]}),
  ],
})

ruleTester.run('no-unused-modules', rule, {
  valid: [],
  invalid: [
    test({ options: unusedExportsOptions,
           code: `export { m1, m} from '${testFilePath('./no-unused-modules/file-m.js')}';`,
           filename: testFilePath('./no-unused-modules/file-0.js'),
           errors: [
             error(`exported declaration 'm1' not used within other modules`),
             error(`exported declaration 'm' not used within other modules`),
           ]}),
    test({ options: unusedExportsOptions,
           code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-m.js'),
           errors: [error(`exported declaration 'default' not used within other modules`)]}),
  ],
})

ruleTester.run('no-unused-modules', rule, {
  valid: [
    // test({ options: unusedExportsOptions,
    //        code: `export { default, m1 } from '${testFilePath('./no-unused-modules/file-m.js')}';`,
    //        filename: testFilePath('./no-unused-modules/file-0.js')}),
  ],
  invalid: [
    test({ options: unusedExportsOptions,
           code: `export { default, m1 } from '${testFilePath('./no-unused-modules/file-m.js')}';`,
           filename: testFilePath('./no-unused-modules/file-0.js'),
           errors: [
             error(`exported declaration 'default' not used within other modules`),
             error(`exported declaration 'm1' not used within other modules`),
           ]}),
    test({ options: unusedExportsOptions,
           code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
           filename: testFilePath('./no-unused-modules/file-m.js'),
           errors: [error(`exported declaration 'm' not used within other modules`)]}),
  ],
})

describe('test behaviour for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-0.js'), '', {encoding: 'utf8'})
  })

  // add import in newly created file
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `import * as m from '${testFilePath('./no-unused-modules/file-m.js')}'`,
             filename: testFilePath('./no-unused-modules/file-added-0.js')}),
      test({ options: unusedExportsOptions,
             code: 'const m0 = 5; const m = 10; export { m0 as m1, m }; export default () => {}',
             filename: testFilePath('./no-unused-modules/file-m.js')}),
    ],
    invalid: [],
  })

  // add export for newly created file
  ruleTester.run('no-unused-modules', rule, {
    valid: [],
    invalid: [
      test({ options: unusedExportsOptions,
             code: `export default () => {2}`,
             filename: testFilePath('./no-unused-modules/file-added-0.js'),
             errors: [error(`exported declaration 'default' not used within other modules`)]}),
      ],
  })

  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `import def from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
             filename: testFilePath('./no-unused-modules/file-0.js')}),
      test({ options: unusedExportsOptions,
             code: `export default () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-0.js')}),
    ],
    invalid: [],
  })

  // export * only considers named imports. default imports still need to be reported
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `export * from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
             filename: testFilePath('./no-unused-modules/file-0.js')}),
    ],
    invalid: [
      test({ options: unusedExportsOptions,
             code: `export const z = 'z';export default () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-0.js'),
             errors: [error(`exported declaration 'default' not used within other modules`)]}),
    ],
  })
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `export const a = 2`,
             filename: testFilePath('./no-unused-modules/file-added-0.js')}),
    ],
    invalid: [],
  })

  // remove export *. all exports need to be reported
  ruleTester.run('no-unused-modules', rule, {
    valid: [],
    invalid: [
      test({ options: unusedExportsOptions,
             code: `export { a } from '${testFilePath('./no-unused-modules/file-added-0.js')}'`,
             filename: testFilePath('./no-unused-modules/file-0.js'),
             errors: [error(`exported declaration 'a' not used within other modules`)]}),
      test({ options: unusedExportsOptions,
             code: `export const z = 'z';export default () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-0.js'),
             errors: [
               error(`exported declaration 'z' not used within other modules`),
               error(`exported declaration 'default' not used within other modules`),
            ]}),
    ],
  })


  describe('test behaviour for new file', () => {
    before(() => {
      fs.writeFileSync(testFilePath('./no-unused-modules/file-added-1.js'), '', {encoding: 'utf8'})
    })
    ruleTester.run('no-unused-modules', rule, {
      valid: [
        test({ options: unusedExportsOptions,
               code: `export * from '${testFilePath('./no-unused-modules/file-added-1.js')}'`,
               filename: testFilePath('./no-unused-modules/file-0.js')}),
      ],
      invalid: [
        test({ options: unusedExportsOptions,
               code: `export const z = 'z';export default () => {}`,
               filename: testFilePath('./no-unused-modules/file-added-1.js'),
               errors: [error(`exported declaration 'default' not used within other modules`)]}),
      ],
    })
    after(() => {
      if (fs.existsSync(testFilePath('./no-unused-modules/file-added-1.js'))) {
        fs.unlinkSync(testFilePath('./no-unused-modules/file-added-1.js'))
      }
    })
  })

  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-0.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-0.js'))
    }
  })
})

describe('test behaviour for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-2.js'), '', {encoding: 'utf8'})
  })
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `import added from '${testFilePath('./no-unused-modules/file-added-2.js')}'`,
             filename: testFilePath('./no-unused-modules/file-added-1.js')}),
      test({ options: unusedExportsOptions,
             code: `export default () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-2.js')}),
    ],
    invalid: [],
  })
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-2.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-2.js'))
    }
  })
})

describe('test behaviour for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-3.js'), '', {encoding: 'utf8'})
  })
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `import { added } from '${testFilePath('./no-unused-modules/file-added-3.js')}'`,
             filename: testFilePath('./no-unused-modules/file-added-1.js')}),
      test({ options: unusedExportsOptions,
             code: `export const added = () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-3.js')}),
    ],
    invalid: [],
  })
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-3.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-3.js'))
    }
  })
})

describe('test behaviour for new file', () => {
  before(() => {
    fs.writeFileSync(testFilePath('./no-unused-modules/file-added-4.js.js'), '', {encoding: 'utf8'})
  })
  ruleTester.run('no-unused-modules', rule, {
    valid: [
      test({ options: unusedExportsOptions,
             code: `import * as added from '${testFilePath('./no-unused-modules/file-added-4.js.js')}'`,
             filename: testFilePath('./no-unused-modules/file-added-1.js')}),
      test({ options: unusedExportsOptions,
             code: `export const added = () => {}; export default () => {}`,
             filename: testFilePath('./no-unused-modules/file-added-4.js.js')}),
    ],
    invalid: [],
  })
  after(() => {
    if (fs.existsSync(testFilePath('./no-unused-modules/file-added-4.js.js'))) {
      fs.unlinkSync(testFilePath('./no-unused-modules/file-added-4.js.js'))
    }
  })
})
