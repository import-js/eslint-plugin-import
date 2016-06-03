import * as path from 'path'

import assign from 'object-assign'
import { test } from '../utils'

import { RuleTester } from 'eslint'

var ruleTester = new RuleTester()
  , rule = require('rules/no-unresolved')

function runResolverTests(resolver) {
  // redefine 'test' to set a resolver
  // thus 'rest'. needed something 4-chars-long for formatting simplicity
  function rest(specs) {
    specs.settings = assign({},
      specs.settings,
      { 'import/resolver': resolver }
    )

    return test(specs)
  }

  ruleTester.run(`no-unresolved (${resolver})`, rule, {
    valid: [
      test({ code: 'import "./malformed.js"' }),

      rest({ code: 'import foo from "./bar";' }),
      rest({ code: "import bar from './bar.js';" }),
      rest({ code: "import {someThing} from './test-module';" }),
      rest({ code: "import fs from 'fs';" }),

      rest({ code: 'import * as foo from "a"' }),

      rest({ code: 'export { foo } from "./bar"' }),
      rest({ code: 'export * from "./bar"' }),
      rest({ code: 'export { foo }' }),

      // stage 1 proposal for export symmetry,
      rest({ code: 'export * as bar from "./bar"'
           , parser: 'babel-eslint' }),
      rest({ code: 'export bar from "./bar"'
           , parser: 'babel-eslint' }),
      rest({ code: 'import foo from "./jsx/MyUnCoolComponent.jsx"' }),

      // commonjs setting
      rest({ code: 'var foo = require("./bar")'
           , options: [{ commonjs: true }]}),
      rest({ code: 'require("./bar")'
           , options: [{ commonjs: true }]}),
      rest({ code: 'require("./does-not-exist")'
           , options: [{ commonjs: false }]}),
      rest({ code: 'require("./does-not-exist")' }),

      // amd setting
      rest({ code: 'require(["./bar"], function (bar) {})'
           , options: [{ amd: true }]}),
      rest({ code: 'define(["./bar"], function (bar) {})'
           , options: [{ amd: true }]}),
      rest({ code: 'require(["./does-not-exist"], function (bar) {})'
           , options: [{ amd: false }]}),
      // magic modules: http://git.io/vByan
      rest({ code: 'define(["require", "exports", "module"], function (r, e, m) { })'
           , options: [{ amd: true }]}),

      // don't validate without callback param
      rest({ code: 'require(["./does-not-exist"])'
           , options: [{ amd: true }]}),
      rest({ code: 'define(["./does-not-exist"], function (bar) {})' }),

      // stress tests
      rest({ code: 'require("./does-not-exist", "another arg")'
           , options: [{ commonjs: true, amd: true }]}),
      rest({ code: 'proxyquire("./does-not-exist")'
           , options: [{ commonjs: true, amd: true }]}),
      rest({ code: '(function() {})("./does-not-exist")'
           , options: [{ commonjs: true, amd: true }]}),
      rest({ code: 'define([0, foo], function (bar) {})'
           , options: [{ amd: true }]}),
      rest({ code: 'require(0)'
           , options: [{ commonjs: true }]}),
      rest({ code: 'require(foo)'
           , options: [{ commonjs: true }]}),

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
        errors: [{ message: "Unable to resolve path to module './baz'."
                 , type: 'Literal' }],
      }),
      rest({ code: "import bar from './baz';"
           , errors: [{ message: "Unable to resolve path to module './baz'."
                      , type: 'Literal',
                      }] }),
      rest({
        code: "import bar from './empty-folder';",
        errors: [{ message: "Unable to resolve path to module './empty-folder'."
                 , type: 'Literal',
                 }]}),

      // sanity check that this module is _not_ found without proper settings
      rest({
        code: "import { DEEP } from 'in-alternate-root';",
        errors: [{ message: 'Unable to resolve path to ' +
                            "module 'in-alternate-root'."
                 , type: 'Literal',
                 }]}),

      rest({ code: 'export { foo } from "./does-not-exist"'
           , errors: ["Unable to resolve path to module './does-not-exist'."] }),
      rest({
        code: 'export * from "./does-not-exist"',
        errors: ["Unable to resolve path to module './does-not-exist'."],
      }),

      // export symmetry proposal
      rest({ code: 'export * as bar from "./does-not-exist"'
           , parser: 'babel-eslint'
           , errors: ["Unable to resolve path to module './does-not-exist'."],
           }),
      rest({ code: 'export bar from "./does-not-exist"'
           , parser: 'babel-eslint'
           , errors: ["Unable to resolve path to module './does-not-exist'."],
           }),

      rest({ code: 'import foo from "./jsx/MyUncoolComponent.jsx"'
           , errors: ["Unable to resolve path to module './jsx/MyUncoolComponent.jsx'."] }),


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
  })
}

['node', 'webpack'].forEach(runResolverTests)

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
      settings: {'import/resolve': { 'paths': [
        path.join('tests', 'files', 'src-root'),
        path.join('tests', 'files', 'alternate-root'),
      ]}}}),

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
})

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
})


ruleTester.run('no-unresolved ignore list', rule, {
  valid: [
    test({
      code: 'import "./malformed.js"',
      options: [{ ignore: ['\.png$', '\.gif$']}],
    }),
    test({
      code: 'import "./test.giffy"',
      options: [{ ignore: ['\.png$', '\.gif$']}],
    }),

    test({
      code: 'import "./test.gif"',
      options: [{ ignore: ['\.png$', '\.gif$']}],
    }),

    test({
      code: 'import "./test.png"',
      options: [{ ignore: ['\.png$', '\.gif$']}],
    }),
  ],

  invalid:[
    test({
      code: 'import "./test.gif"',
      options: [{ ignore: ['\.png$']}],
      errors: [ "Unable to resolve path to module './test.gif'." ],
    }),

    test({
      code: 'import "./test.png"',
      options: [{ ignore: ['\.gif$']}],
      errors: [ "Unable to resolve path to module './test.png'." ],
    }),
  ],
})

ruleTester.run('no-unresolved unknown resolver', rule, {
  valid: [],

  invalid:[

    // logs resolver load error
    test({
      code: 'import "./malformed.js"',
      settings: { 'import/resolver': 'foo' },
      errors: [
        `Resolve error: unable to load resolver "foo".`,
        `Unable to resolve path to module './malformed.js'.`,
      ],
    }),

    // only logs resolver message once
    test({
      code: 'import "./malformed.js"; import "./fake.js"',
      settings: { 'import/resolver': 'foo' },
      errors: [
        `Resolve error: unable to load resolver "foo".`,
        `Unable to resolve path to module './malformed.js'.`,
        `Unable to resolve path to module './fake.js'.`,
      ],
    }),
  ],
})

ruleTester.run('no-unresolved electron', rule, {
  valid: [
    test({
      code: 'import "electron"',
      settings: { 'import/env': 'electron' },
    }),
  ],
  invalid:[
    test({
      code: 'import "electron"',
      errors: [`Unable to resolve path to module 'electron'.`],
    }),
  ],
})
