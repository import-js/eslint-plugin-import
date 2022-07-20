import { parsers, test as _test, testFilePath, testVersion as _testVersion } from '../utils';

import { RuleTester } from 'eslint';

const flatMap = Function.bind.bind(Function.prototype.call)(Array.prototype.flatMap);

const ruleTester = new RuleTester();
const rule = require('rules/no-cycle');

const error = (message) => ({ message });

const test = (def) => _test(Object.assign(def, {
  filename: testFilePath('./cycles/depth-zero.js'),
}));
const testVersion = (specifier, t) => _testVersion(specifier, () => Object.assign(t(), {
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
        code: `import("./${testDialect}/depth-two").then(function({ foo }) {})`,
        options: [{ maxDepth: 1 }],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `import type { FooType } from "./${testDialect}/depth-one"`,
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `import type { FooType, BarType } from "./${testDialect}/depth-one"`,
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `function bar(){ return import("./${testDialect}/depth-one"); } // #2265 1`,
        options: [{ allowUnsafeDynamicCyclicDependency: true }],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one-dynamic"; // #2265 2`,
        options: [{ allowUnsafeDynamicCyclicDependency: true }],
        parser: parsers.BABEL_OLD,
      }),
    ].concat(parsers.TS_NEW ? [
      test({
        code: `function bar(){ return import("./${testDialect}/depth-one"); } // #2265 3`,
        options: [{ allowUnsafeDynamicCyclicDependency: true }],
        parser: parsers.TS_NEW,
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one-dynamic"; // #2265 4`,
        options: [{ allowUnsafeDynamicCyclicDependency: true }],
        parser: parsers.TS_NEW,
      }),
    ] : [])),

    test({
      code: 'import { bar } from "./flow-types"',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import { bar } from "./flow-types-only-importing-type"',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import { bar } from "./flow-types-only-importing-multiple-types"',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import { bar } from "./flow-typeof"',
      parser: parsers.BABEL_OLD,
    }),
  ),

  invalid: [].concat(
    test({
      code: 'import { bar } from "./flow-types-some-type-imports"',
      parser: parsers.BABEL_OLD,
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

    // Ensure behavior does not change for those tests, with or without `
    flatMap(testDialects, (testDialect) => flatMap([
      {},
      { allowUnsafeDynamicCyclicDependency: true },
    ], (opts) => [
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one"`,
        options: [{ ...opts, maxDepth: 1 }],
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-one")`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ ...opts, commonjs: true }],
      }),
      test({
        code: `require(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ ...opts, amd: true }],
      }),
      test({
        code: `define(["./${testDialect}/depth-one"], d1 => {})`,
        errors: [error(`Dependency cycle detected.`)],
        options: [{ ...opts, amd: true }],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one-reexport"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle detected.`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ ...opts, maxDepth: 2 }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `const { foo } = require("./${testDialect}/depth-two")`,
        errors: [error(`Dependency cycle via ./depth-one:1`)],
        options: [{ ...opts, commonjs: true }],
      }),
      test({
        code: `import { two } from "./${testDialect}/depth-three-star"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import one, { two, three } from "./${testDialect}/depth-three-star"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
      }),
      test({
        code: `import { bar } from "./${testDialect}/depth-three-indirect"`,
        options: [{ ...opts }],
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ ...opts, maxDepth: Infinity }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-two"`,
        options: [{ ...opts, maxDepth: '∞' }],
        errors: [error(`Dependency cycle via ./depth-one:1`)],
      }),
    ]).concat([
      test({
        code: `import("./${testDialect}/depth-three-star")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: parsers.BABEL_OLD,
      }),
      test({
        code: `import("./${testDialect}/depth-three-indirect")`,
        errors: [error(`Dependency cycle via ./depth-two:1=>./depth-one:1`)],
        parser: parsers.BABEL_OLD,
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
      test({
        code: `function bar(){ return import("./${testDialect}/depth-one"); } // #2265 5`,
        errors: [error(`Dependency cycle detected.`)],
        parser: parsers.BABEL_OLD,
      }),
    ]).concat(
      testVersion('> 3', () => ({ // Dynamic import is not properly caracterized with eslint < 4
        code: `import { foo } from "./${testDialect}/depth-one-dynamic"; // #2265 6`,
        errors: [error(`Dependency cycle detected.`)],
        parser: parsers.BABEL_OLD,
      })),
    ).concat(parsers.TS_NEW ? [
      test({
        code: `function bar(){ return import("./${testDialect}/depth-one"); } // #2265 7`,
        errors: [error(`Dependency cycle detected.`)],
        parser: parsers.TS_NEW,
      }),
      test({
        code: `import { foo } from "./${testDialect}/depth-one-dynamic"; // #2265 8`,
        errors: [error(`Dependency cycle detected.`)],
        parser: parsers.TS_NEW,
      }),
    ] : [])),

    test({
      code: 'import { bar } from "./flow-types-depth-one"',
      parser: parsers.BABEL_OLD,
      errors: [error(`Dependency cycle via ./flow-types-depth-two:4=>./es6/depth-one:1`)],
    }),
    test({
      code: 'import { foo } from "./intermediate-ignore"',
      errors: [
        {
          message: 'Dependency cycle via ./ignore:1',
          line: 1,
        },
      ],
    }),
    test({
      code: 'import { foo } from "./ignore"',
      errors: [
        {
          message: 'Dependency cycle detected.',
          line: 1,
        },
      ],
    }),
  ),
});
