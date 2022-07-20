import { RuleTester } from 'eslint';
import rule from 'rules/no-internal-modules';

import { test, testFilePath, getTSParsers } from '../utils';

const flatMap = Function.bind.bind(Function.prototype.call)(Array.prototype.flatMap);

const ruleTester = new RuleTester();

ruleTester.run('no-internal-modules', rule, {
  valid: [
    // imports
    test({
      code: 'import a from "./plugin2"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [],
    }),
    test({
      code: 'const a = require("./plugin2")',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'const a = require("./plugin2/")',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'const dynamic = "./plugin2/"; const a = require(dynamic)',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
    }),
    test({
      code: 'import b from "./internal.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import get from "lodash.get"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'import b from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
    }),
    test({
      code: 'import b from "../../api/service"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['**/api/*'],
      }],
    }),
    test({
      code: 'import "jquery/dist/jquery"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['jquery/dist/*'],
      }],
    }),
    test({
      code: 'import "./app/index.js";\nimport "./app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['**/index{.js,}'],
      }],
    }),
    test({
      code: 'import a from "./plugin2/thing"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        forbid: ['**/api/*'],
      }],
    }),
    test({
      code: 'const a = require("./plugin2/thing")',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        forbid: ['**/api/*'],
      }],
    }),
    test({
      code: 'import b from "app/a"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['app/**/**'],
      }],
    }),
    test({
      code: 'import b from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['@org/package/*'],
      }],
    }),
    // exports
    test({
      code: 'export {a} from "./internal.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'export * from "lodash.get"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
    }),
    test({
      code: 'export {b} from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
    }),
    test({
      code: 'export {b} from "../../api/service"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['**/api/*'],
      }],
    }),
    test({
      code: 'export * from "jquery/dist/jquery"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['jquery/dist/*'],
      }],
    }),
    test({
      code: 'export * from "./app/index.js";\nexport * from "./app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        allow: ['**/index{.js,}'],
      }],
    }),
    test({
      code: `
        export class AuthHelper {

          static checkAuth(auth) {
          }
        }
      `,
    }),
    ...flatMap(getTSParsers(), (parser) => [
      test({
        code: `
          export class AuthHelper {

            public static checkAuth(auth?: string): boolean {
            }
          }
        `,
        parser,
      }),
    ]),
    test({
      code: 'export * from "./plugin2/thing"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        forbid: ['**/api/*'],
      }],
    }),
    test({
      code: 'export * from "app/a"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['app/**/**'],
      }],
    }),
    test({
      code: 'export { b } from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['@org/package/*'],
      }],
    }),
    test({
      code: 'export * from "./app/index.js";\nexport * from "./app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['**/index.ts'],
      }],
    }),
  ],

  invalid: [
    // imports
    test({
      code: 'import "./plugin2/index.js";\nimport "./plugin2/app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        allow: ['*/index.js'],
      }],
      errors: [{
        message: 'Reaching to "./plugin2/app/index" is not allowed.',
        line: 2,
        column: 8,
      }],
    }),
    test({
      code: 'import "./app/index.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [{
        message: 'Reaching to "./app/index.js" is not allowed.',
        line: 1,
        column: 8,
      }],
    }),
    test({
      code: 'import b from "./plugin2/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [{
        message: 'Reaching to "./plugin2/internal" is not allowed.',
        line: 1,
        column: 15,
      }],
    }),
    test({
      code: 'import a from "../api/service/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        allow: ['**/internal-modules/*'],
      }],
      errors: [
        {
          message: 'Reaching to "../api/service/index" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import b from "@org/package/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [
        {
          message: 'Reaching to "@org/package/internal" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'import get from "debug/src/node"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [
        {
          message: 'Reaching to "debug/src/node" is not allowed.',
          line: 1,
          column: 17,
        },
      ],
    }),
    test({
      code: 'import "./app/index.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['*/app/*'],
      }],
      errors: [{
        message: 'Reaching to "./app/index.js" is not allowed.',
        line: 1,
        column: 8,
      }],
    }),
    test({
      code: 'import b from "@org/package"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['@org/**'],
      }],
      errors: [{
        message: 'Reaching to "@org/package" is not allowed.',
        line: 1,
        column: 15,
      }],
    }),
    test({
      code: 'import b from "app/a/b"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['app/**/**'],
      }],
      errors: [{
        message: 'Reaching to "app/a/b" is not allowed.',
        line: 1,
        column: 15,
      }],
    }),
    test({
      code: 'import get from "lodash.get"',
      filename: testFilePath('./internal-modules/plugins/plugin2/index.js'),
      options: [{
        forbid: ['lodash.*'],
      }],
      errors: [{
        message: 'Reaching to "lodash.get" is not allowed.',
        line: 1,
        column: 17,
      }],
    }),
    test({
      code: 'import "./app/index.js";\nimport "./app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['**/index{.js,}'],
      }],
      errors: [{
        message: 'Reaching to "./app/index.js" is not allowed.',
        line: 1,
        column: 8,
      }, {
        message: 'Reaching to "./app/index" is not allowed.',
        line: 2,
        column: 8,
      }],
    }),
    test({
      code: 'import "@/api/service";',
      options: [{
        forbid: ['**/api/*'],
      }],
      errors: [{
        message: 'Reaching to "@/api/service" is not allowed.',
        line: 1,
        column: 8,
      }],
      settings: {
        'import/resolver': {
          webpack: {
            config: {
              resolve: {
                alias: {
                  '@': testFilePath('internal-modules'),
                },
              },
            },
          },
        },
      },
    }),
    // exports
    test({
      code: 'export * from "./plugin2/index.js";\nexport * from "./plugin2/app/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        allow: ['*/index.js'],
      }],
      errors: [{
        message: 'Reaching to "./plugin2/app/index" is not allowed.',
        line: 2,
        column: 15,
      }],
    }),
    test({
      code: 'export * from "./app/index.js"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [{
        message: 'Reaching to "./app/index.js" is not allowed.',
        line: 1,
        column: 15,
      }],
    }),
    test({
      code: 'export {b} from "./plugin2/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [{
        message: 'Reaching to "./plugin2/internal" is not allowed.',
        line: 1,
        column: 17,
      }],
    }),
    test({
      code: 'export {a} from "../api/service/index"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        allow: ['**/internal-modules/*'],
      }],
      errors: [
        {
          message: 'Reaching to "../api/service/index" is not allowed.',
          line: 1,
          column: 17,
        },
      ],
    }),
    test({
      code: 'export {b} from "@org/package/internal"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      errors: [
        {
          message: 'Reaching to "@org/package/internal" is not allowed.',
          line: 1,
          column: 17,
        },
      ],
    }),
    test({
      code: 'export {get} from "debug/src/node"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      errors: [
        {
          message: 'Reaching to "debug/src/node" is not allowed.',
          line: 1,
          column: 19,
        },
      ],
    }),
    test({
      code: 'export * from "./plugin2/thing"',
      filename: testFilePath('./internal-modules/plugins/plugin.js'),
      options: [{
        forbid: ['**/plugin2/*'],
      }],
      errors: [
        {
          message: 'Reaching to "./plugin2/thing" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
    test({
      code: 'export * from "app/a"',
      filename: testFilePath('./internal-modules/plugins/plugin2/internal.js'),
      options: [{
        forbid: ['**'],
      }],
      errors: [
        {
          message: 'Reaching to "app/a" is not allowed.',
          line: 1,
          column: 15,
        },
      ],
    }),
  ],
});
