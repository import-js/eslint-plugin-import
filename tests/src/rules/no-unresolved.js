import * as path from 'path';

import { test, SYNTAX_CASES } from '../utils';

import { CASE_SENSITIVE_FS } from 'eslint-module-utils/resolve';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-unresolved');

function runResolverTests(resolver) {
  // redefine 'test' to set a resolver
  // thus 'rest'. needed something 4-chars-long for formatting simplicity
  function rest(specs) {
    specs.settings = Object.assign({},
      specs.settings,
      { 'import/resolver': resolver },
    );

    return test(specs);
  }

  ruleTester.run(`no-unresolved (${resolver})`, rule, {
    valid: [
      test({ code: 'import "./malformed.js"' }),

      rest({ code: 'import foo from "./bar";' }),
      rest({ code: "import bar from './bar.js';" }),
      rest({ code: "import {someThing} from './test-module';" }),
      rest({ code: "import fs from 'fs';" }),
      rest({ code: "import('fs');",
        parser: require.resolve('babel-eslint') }),

      rest({ code: 'import * as foo from "a"' }),

      rest({ code: 'export { foo } from "./bar"' }),
      rest({ code: 'export * from "./bar"' }),
      rest({ code: 'let foo; export { foo }' }),

      // stage 1 proposal for export symmetry,
      rest({ code: 'export * as bar from "./bar"',
        parser: require.resolve('babel-eslint') }),
      rest({ code: 'export bar from "./bar"',
        parser: require.resolve('babel-eslint') }),
      rest({ code: 'import foo from "./jsx/MyUnCoolComponent.jsx"' }),

      // commonjs setting
      rest({ code: 'var foo = require("./bar")',
        options: [{ commonjs: true }] }),
      rest({ code: 'require("./bar")',
        options: [{ commonjs: true }] }),
      rest({ code: 'require("./does-not-exist")',
        options: [{ commonjs: false }] }),
      rest({ code: 'require("./does-not-exist")' }),

      // amd setting
      rest({ code: 'require(["./bar"], function (bar) {})',
        options: [{ amd: true }] }),
      rest({ code: 'define(["./bar"], function (bar) {})',
        options: [{ amd: true }] }),
      rest({ code: 'require(["./does-not-exist"], function (bar) {})',
        options: [{ amd: false }] }),
      // magic modules: http://git.io/vByan
      rest({ code: 'define(["require", "exports", "module"], function (r, e, m) { })',
        options: [{ amd: true }] }),

      // don't validate without callback param
      rest({ code: 'require(["./does-not-exist"])',
        options: [{ amd: true }] }),
      rest({ code: 'define(["./does-not-exist"], function (bar) {})' }),

      // stress tests
      rest({ code: 'require("./does-not-exist", "another arg")',
        options: [{ commonjs: true, amd: true }] }),
      rest({ code: 'proxyquire("./does-not-exist")',
        options: [{ commonjs: true, amd: true }] }),
      rest({ code: '(function() {})("./does-not-exist")',
        options: [{ commonjs: true, amd: true }] }),
      rest({ code: 'define([0, foo], function (bar) {})',
        options: [{ amd: true }] }),
      rest({ code: 'require(0)',
        options: [{ commonjs: true }] }),
      rest({ code: 'require(foo)',
        options: [{ commonjs: true }] }),
    ],

    invalid: [
      rest({
        code: 'import reallyfake from "./reallyfake/module"',
        settings: { 'import/ignore': ['^\\./fake/'] },
        errors: [{ message: 'Unable to resolve path to module ' +
                            '\'./reallyfake/module\'.' }],
      }),


      rest({
        code: "import bar from './baz';",
        errors: [{ message: "Unable to resolve path to module './baz'.",
          type: 'Literal' }],
      }),
      rest({ code: "import bar from './baz';",
        errors: [{ message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        }] }),
      rest({
        code: "import bar from './empty-folder';",
        errors: [{ message: "Unable to resolve path to module './empty-folder'.",
          type: 'Literal',
        }] }),

      // sanity check that this module is _not_ found without proper settings
      rest({
        code: "import { DEEP } from 'in-alternate-root';",
        errors: [{ message: 'Unable to resolve path to ' +
                            "module 'in-alternate-root'.",
        type: 'Literal',
        }] }),
      rest({
        code: "import('in-alternate-root').then(function({DEEP}){});",
        errors: [{ message: 'Unable to resolve path to ' +
                          "module 'in-alternate-root'.",
        type: 'Literal',
        }],
        parser: require.resolve('babel-eslint') }),

      rest({ code: 'export { foo } from "./does-not-exist"',
        errors: ["Unable to resolve path to module './does-not-exist'."] }),
      rest({
        code: 'export * from "./does-not-exist"',
        errors: ["Unable to resolve path to module './does-not-exist'."],
      }),

      // export symmetry proposal
      rest({ code: 'export * as bar from "./does-not-exist"',
        parser: require.resolve('babel-eslint'),
        errors: ["Unable to resolve path to module './does-not-exist'."],
      }),
      rest({ code: 'export bar from "./does-not-exist"',
        parser: require.resolve('babel-eslint'),
        errors: ["Unable to resolve path to module './does-not-exist'."],
      }),

      // commonjs setting
      rest({
        code: 'var bar = require("./baz")',
        options: [{ commonjs: true }],
        errors: [{
          message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        }],
      }),
      rest({
        code: 'require("./baz")',
        options: [{ commonjs: true }],
        errors: [{
          message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        }],
      }),

      // amd
      rest({
        code: 'require(["./baz"], function (bar) {})',
        options: [{ amd: true }],
        errors: [{
          message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        }],
      }),
      rest({
        code: 'define(["./baz"], function (bar) {})',
        options: [{ amd: true }],
        errors: [{
          message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        }],
      }),
      rest({
        code: 'define(["./baz", "./bar", "./does-not-exist"], function (bar) {})',
        options: [{ amd: true }],
        errors: [{
          message: "Unable to resolve path to module './baz'.",
          type: 'Literal',
        },{
          message: "Unable to resolve path to module './does-not-exist'.",
          type: 'Literal',
        }],
      }),
    ],
  });

  ruleTester.run(`issue #333 (${resolver})`, rule, {
    valid: [
      rest({ code: 'import foo from "./bar.json"' }),
      rest({ code: 'import foo from "./bar"' }),
      rest({
        code: 'import foo from "./bar.json"',
        settings: { 'import/extensions': ['.js'] },
      }),
      rest({
        code: 'import foo from "./bar"',
        settings: { 'import/extensions': ['.js'] },
      }),
    ],
    invalid: [
      rest({
        code: 'import bar from "./foo.json"',
        errors: ["Unable to resolve path to module './foo.json'."],
      }),
    ],
  });

  if (!CASE_SENSITIVE_FS) {
    ruleTester.run('case sensitivity', rule, {
      valid: [
        rest({ // test with explicit flag
          code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
          options: [{ caseSensitive: false }],
        }),
      ],

      invalid: [
        rest({ // test default
          code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
          errors: [`Casing of ./jsx/MyUncoolComponent.jsx does not match the underlying filesystem.`],
        }),
        rest({ // test with explicit flag
          code: 'import foo from "./jsx/MyUncoolComponent.jsx"',
          options: [{ caseSensitive: true }],
          errors: [`Casing of ./jsx/MyUncoolComponent.jsx does not match the underlying filesystem.`],
        }),
      ],
    });
  }

}

['node', 'webpack'].forEach(runResolverTests);

ruleTester.run('no-unresolved (import/resolve legacy)', rule, {
  valid: [
    test({
      code: "import { DEEP } from 'in-alternate-root';",
      settings: {
        'import/resolve': {
          'paths': [path.join( process.cwd()
            , 'tests', 'files', 'alternate-root')],
        },
      },
    }),

    test({
      code: "import { DEEP } from 'in-alternate-root'; " +
            "import { bar } from 'src-bar';",
      settings: { 'import/resolve': { 'paths': [
        path.join('tests', 'files', 'src-root'),
        path.join('tests', 'files', 'alternate-root'),
      ] } } }),

    test({
      code: 'import * as foo from "jsx-module/foo"',
      settings: { 'import/resolve': { 'extensions': ['.jsx'] } },
    }),
  ],

  invalid: [
    test({
      code: 'import * as foo from "jsx-module/foo"',
      errors: [ "Unable to resolve path to module 'jsx-module/foo'." ],
    }),
  ],
});

ruleTester.run('no-unresolved (webpack-specific)', rule, {
  valid: [
    test({
      // default webpack config in files/webpack.config.js knows about jsx
      code: 'import * as foo from "jsx-module/foo"',
      settings: { 'import/resolver': 'webpack' },
    }),
    test({
      // should ignore loaders
      code: 'import * as foo from "some-loader?with=args!jsx-module/foo"',
      settings: { 'import/resolver': 'webpack' },
    }),
  ],
  invalid: [
    test({
      // default webpack config in files/webpack.config.js knows about jsx
      code: 'import * as foo from "jsx-module/foo"',
      settings: {
        'import/resolver': { 'webpack': { 'config': 'webpack.empty.config.js' } },
      },
      errors: [ "Unable to resolve path to module 'jsx-module/foo'." ],
    }),
  ],
});


ruleTester.run('no-unresolved ignore list', rule, {
  valid: [
    test({
      code: 'import "./malformed.js"',
      options: [{ ignore: ['.png$', '.gif$'] }],
    }),
    test({
      code: 'import "./test.giffy"',
      options: [{ ignore: ['.png$', '.gif$'] }],
    }),

    test({
      code: 'import "./test.gif"',
      options: [{ ignore: ['.png$', '.gif$'] }],
    }),

    test({
      code: 'import "./test.png"',
      options: [{ ignore: ['.png$', '.gif$'] }],
    }),
  ],

  invalid:[
    test({
      code: 'import "./test.gif"',
      options: [{ ignore: ['.png$'] }],
      errors: [ "Unable to resolve path to module './test.gif'." ],
    }),

    test({
      code: 'import "./test.png"',
      options: [{ ignore: ['.gif$'] }],
      errors: [ "Unable to resolve path to module './test.png'." ],
    }),
  ],
});

ruleTester.run('no-unresolved unknown resolver', rule, {
  valid: [],

  invalid:[

    // logs resolver load error
    test({
      code: 'import "./malformed.js"',
      settings: { 'import/resolver': 'doesnt-exist' },
      errors: [
        `Resolve error: unable to load resolver "doesnt-exist".`,
        `Unable to resolve path to module './malformed.js'.`,
      ],
    }),

    // only logs resolver message once
    test({
      code: 'import "./malformed.js"; import "./fake.js"',
      settings: { 'import/resolver': 'doesnt-exist' },
      errors: [
        `Resolve error: unable to load resolver "doesnt-exist".`,
        `Unable to resolve path to module './malformed.js'.`,
        `Unable to resolve path to module './fake.js'.`,
      ],
    }),
  ],
});

ruleTester.run('no-unresolved electron', rule, {
  valid: [
    test({
      code: 'import "electron"',
      settings: { 'import/core-modules': ['electron'] },
    }),
  ],
  invalid:[
    test({
      code: 'import "electron"',
      errors: [`Unable to resolve path to module 'electron'.`],
    }),
  ],
});

ruleTester.run('no-unresolved sub-directory', rule, {
  valid: [
    test({
      code: 'import "@generated/bar/module"',
      settings: { 'import/core-modules': ['@generated/bar'] },
    }),
    test({
      code: 'import "@generated/bar/and/sub/path"',
      settings: { 'import/core-modules': ['@generated/bar'] },
    }),
  ],
  invalid:[
    test({
      code: 'import "@generated/bar/module"',
      errors: [`Unable to resolve path to module '@generated/bar/module'.`],
    }),
  ],
});

ruleTester.run('no-unresolved syntax verification', rule, {
  valid: SYNTAX_CASES,
  invalid:[],
});
