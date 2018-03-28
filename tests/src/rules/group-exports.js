import { test } from '../utils'
import { RuleTester } from 'eslint'
import rule from 'rules/group-exports'

/* eslint-disable max-len */
const errors = {
  named: 'Multiple named export declarations; consolidate all named exports into a single export declaration',
  commonjs: 'Multiple CommonJS exports; consolidate all exports into a single assignment to `module.exports`',
}
/* eslint-enable max-len */
const ruleTester = new RuleTester()

ruleTester.run('group-exports', rule, {
  valid: [
    test({ code: 'export const test = true' }),
    test({ code: `
      export default {}
      export const test = true
    ` }),
    test({ code: `
      const first = true
      const second = true
      export {
        first,
        second
      }
    ` }),
    test({ code: `
      export default {}
      /* test */
      export const test = true
    ` }),
    test({ code: `
      export default {}
      // test
      export const test = true
    ` }),
    test({ code: `
      export const test = true
      /* test */
      export default {}
    ` }),
    test({ code: `
      export const test = true
      // test
      export default {}
    ` }),
    test({ code: 'module.exports = {} '}),
    test({ code: `
      module.exports = { test: true,
        another: false }
    ` }),
    test({ code: 'exports.test = true' }),

    test({ code: `
      module.exports = {}
      const test = module.exports
    ` }),
    test({ code: `
      exports.test = true
      const test = exports.test
    ` }),
    test({ code: `
      module.exports = {}
      module.exports.too.deep = true
    ` }),
    test({ code: `
      module.exports.deep.first = true
      module.exports.deep.second = true
    ` }),
    test({ code: `
      module.exports = {}
      exports.too.deep = true
    ` }),
    test({ code: `
      export default {}
      const test = true
      export { test }
    ` }),
    test({ code: `
      const test = true
      export { test }
      const another = true
      export default {}
    ` }),
    test({ code: `
      module.something.else = true
      module.something.different = true
    ` }),
    test({ code: `
      module.exports.test = true
      module.something.different = true
    ` }),
    test({ code: `
      exports.test = true
      module.something.different = true
    ` }),
    test({ code: `
      unrelated = 'assignment'
      module.exports.test = true
    ` }),
  ],
  invalid: [
    test({
      code: `
        export const test = true
        export const another = true
      `,
      errors: [
        errors.named,
        errors.named,
      ],
    }),
    test({
      code: `
        module.exports = {}
        module.exports.test = true
        module.exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = {}
        module.exports.test = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = { test: true }
        module.exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports.test = true
        module.exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        exports.test = true
        module.exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = () => {}
        module.exports.attached = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = function test() {}
        module.exports.attached = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = () => {}
        exports.test = true
        exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = "non-object"
        module.exports.attached = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
      ],
    }),
    test({
      code: `
        module.exports = "non-object"
        module.exports.attached = true
        module.exports.another = true
      `,
      errors: [
        errors.commonjs,
        errors.commonjs,
        errors.commonjs,
      ],
    }),
  ],
})
