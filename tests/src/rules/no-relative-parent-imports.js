import { RuleTester } from 'eslint'
import rule from 'rules/no-relative-parent-imports'

import { test, testFilePath } from '../utils'

const ruleTester = new RuleTester()

ruleTester.run('no-relative-parent-imports', rule, {
  valid: [
    test({
      code: 'import foo from "./internal.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import foo from "./app/index.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import foo from "package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'require("./internal.js")',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'require("./app/index.js")',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'require("package")',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
  ],

  invalid: [
    test({
      code: 'import foo from "../plugin.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
      errors: [ {
        message: 'Relative imports from parent directories are not allowed.',
        line: 1,
        column: 17,
      } ],
    }),
    test({
      code: 'require("../plugin.js")',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
      errors: [ {
        message: 'Relative imports from parent directories are not allowed.',
        line: 1,
        column: 9,
      } ],
    }),
  ],
})
