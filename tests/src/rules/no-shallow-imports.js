import { test, testFilePath } from '../utils';
const rule = require('../../../src/rules/no-shallow-imports');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();
const errors = [{ message: 'Please deep import!' }];
const options = [{ 'allow': ['**/index.test.js'] }];
const filename = testFilePath('./index.test.js');

ruleTester.run('no-shallow-imports', rule, {
  valid: [
    test({
      code: 'import { module } from "package"',
    }),
    test({
      code: 'import { module } from "@scope/package"',
    }),
    test({
      code: 'import * as index from "../index"',
      options,
      filename,
    }),
  ],

  invalid: [
    test({
      code: 'import { barrel } from ".."',
      errors,
    }),
    test({
      code: 'import { barrel } from "../.."',
      errors,
    }),
    // test({
    //   code: `import { barrel } from '../../dir';`,
    //   errors,
    // }),
    test({
      code: 'import { barrel } from "../dir/index"',
      errors,
    }),
    test({
      code: 'import { barrel } from "./dir/index.js"',
      errors,
    }),
  ],
});
