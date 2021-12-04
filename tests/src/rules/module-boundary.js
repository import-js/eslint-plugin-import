import { RuleTester } from 'eslint';
import rule from 'rules/module-boundary';
import { test as _test, testFilePath } from '../utils';

const test = def => _test(Object.assign({
  filename: testFilePath('./module-boundary/index.js'),
  parser: require.resolve('babel-eslint'),
}, def));

const ruleTester = new RuleTester();

ruleTester.run('module-boundary', rule, {
  valid: [
    test({
      code: 'import "./a-module"',
    }),
    test({
      code: 'import "./a-module/index"',
    }),
    test({
      code: 'import "./a-module/index.js"',
    }),
    test({
      code: 'import "./b-module/file.js"',
    }),
    test({
      code: 'import "../a-module"',
      filename: testFilePath('./module-boundary/b-module/file.js'),
    }),
    test({
      code: 'import "../file.js"',
      filename: testFilePath('./module-boundary/b-module/file.js'),
    }),
    test({
      code: 'import "./c-module"',
    }),
    test({
      code: 'import "./c-module/file.js"',
    }),
    test({
      code: 'import "esm-package"',
    }),
    test({
      code: 'import "esm-package/esm-module"',
    }),
    test({
      code: 'import "@org/package"',
    }),
    test({
      code: 'import "@org/package/sub-package"',
    }),
    test({
      code: 'import("./a-module")',
    }),
    test({
      code: 'import("./a-module/index")',
    }),
    test({
      code: 'import("./a-module/index.js")',
    }),
    test({
      code: 'import("./b-module/file.js")',
    }),
    test({
      code: 'import("./b-module/sub-b-module")',
    }),
  ],

  invalid: [
    test({
      code: 'import "./a-module/file.js"',
      errors: [ {
        message: 'Passing module boundary. Should import from `./a-module/index.js`.',
        line: 1,
        column: 8,
      } ],
    }),
    test({
      code: 'import "./a-module/sub-a-module/index.js"',
      errors: [ {
        message: 'Passing module boundary. Should import from `./a-module/index.js`.',
        line: 1,
        column: 8,
      } ],
    }),
    test({
      code: 'import "../a-module/file.js"',
      filename: testFilePath('./module-boundary/b-module/file.js'),
      errors: [ {
        message: 'Passing module boundary. Should import from `../a-module/index.js`.',
        line: 1,
        column: 8,
      } ],
    }),
  ],
});
