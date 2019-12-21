import { test as _test, testFilePath } from '../utils';

import { RuleTester } from 'eslint';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester();
const rule = require('rules/no-cycle');

const error = message => ({ message });

const test = def => _test(Object.assign(def, {
  filename: testFilePath('./cycles/depth-zero.js'),
}));

const testDialects = ['es6'];

ruleTester.run('no-cycle', rule, {
  valid: [].concat(
    // this rule doesn't care if the cycle length is 0
    test({ code: 'import foo from "./foo.js"' }),

    test({ code: 'import _ from "lodash"' }),
    test({ code: 'import foo from "@scope/foo"' }),
    test({ code: 'var _ = require("lodash")' }),
    test({ code: 'var find = require("lodash.find")' }),
    test({ code: 'var foo = require("./foo")' }),
    test({ code: 'var foo = require("../foo")' }),
    test({ code: 'var foo = require("foo")' }),
    test({ code: 'var foo = require("./")' }),
    test({ code: 'var foo = require("@scope/foo")' }),
    test({ code: 'var bar = require("./bar/index")' }),
    test({ code: 'var bar = require("./bar")' }),
    test({
      code: 'var bar = require("./bar")',
      filename: '<text>',
    }),
    test({
      code: 'import { foo } from "cycles/external/depth-one"',
      options: [{ ignoreExternal: true }],
      settings: {
        'import/resolver': 'webpack',
        'import/external-module-folders': ['cycles/external'],
      },
    }),
    test({
      code: 'import { foo } from "./external-depth-two"',
      options: [{ ignoreExternal: true }],
      settings: {
        'import/resolver': 'webpack',
        'import/external-module-folders': ['cycles/external'],
      },
    }),

    flatMap(testDialects, (testDialect) => [
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 1 }],
      }),
      test({
        code: `import { foo, bar } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 1 }],
      }),
      test({
        code: `import("./${testDialect}/depth-two").then(function({ foo }){})`,
        options: [{ maxDepth: 1 }],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import type { FooType } from "./${testDialect}/depth-one"`,
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import type { FooType, BarType } from "./${testDialect}/depth-one"`,
        parser: require.resolve('babel-eslint'),
      }),
    ]),

    test({
      code: 'import { bar } from "./flow-types"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { bar } from "./flow-types-only-importing-type"',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { bar } from "./flow-types-only-importing-multiple-types"',
      parser: require.resolve('babel-eslint'),
    }),
  ),

  invalid: [].concat(
    test({
      code: 'import { bar } from "./flow-types-some-type-imports"',
      parser: require.resolve('babel-eslint'),
      errors: [error(`Dependency cycle detected.`)],
    }),
    test({
      code: 'import { foo } from "cycles/external/depth-one"',
      errors: [error(`Dependency cycle detected.`)],
      settings: {
        'import/resolver': 'webpack',
        'import/external-module-folders': ['cycles/external'],
      },
    }),
    test({
      code: 'import { foo } from "./external-depth-two"',
      errors: [error(`Dependency cycle via cycles/external/depth-one:1`)],
      settings: {
        'import/resolver': 'webpack',
        'import/external-module-folders': ['cycles/external'],
      },
    }),

    flatMap(testDialects, (testDialect) => [
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        options: [{ maxDepth: 1 }],
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-one")`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ commonjs: true }],
      }),
      test({
        code: `require(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ amd: true }],
      }),
      test({
        code: `define(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ amd: true }],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: 2 }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-two")`,
        errors: [error(`Dependency cycle via ./depth-one:1`)],
        options: [{ commonjs: true }],
      }),
      test({
        code: `import { two } from "./${testDialect}/depth-three-star"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import one, { two, three } from "./${testDialect}/depth-three-star"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import("./${testDialect}/depth-three-star")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import("./${testDialect}/depth-three-indirect")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: Infinity }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ maxDepth: '∞' }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
    ]),

    test({
      code: 'import { bar } from "./flow-types-depth-one"',
      parser: require.resolve('babel-eslint'),
      errors: [error(`Dependency cycle via ./flow-types-depth-two:4=>./es6/depth-one:1`)],
    }),

    _test({
      code: 'import "./"',
      parser: require.resolve('babel-eslint'),
      errors: [error(`Dependency cycle via `)],
      filename: testFilePath('./cycles/alias/index.js'),
    }),
  ),
});
