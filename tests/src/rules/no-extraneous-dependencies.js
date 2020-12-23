import { getTSParsers, test, testFilePath } from '../utils'
import typescriptConfig from '../../../config/typescript'
import path from 'path'
import fs from 'fs'
import semver from 'semver'
import eslintPkg from 'eslint/package.json'

import { RuleTester } from 'eslint'
import flatMap from 'array.prototype.flatmap'

const ruleTester = new RuleTester()
const typescriptRuleTester = new RuleTester(typescriptConfig)
const rule = require('rules/no-extraneous-dependencies')

const packageDirWithSyntaxError = path.join(__dirname, '../../files/with-syntax-error')
const packageFileWithSyntaxErrorMessage = (() => {
  try {
    JSON.parse(fs.readFileSync(path.join(packageDirWithSyntaxError, 'package.json')))
  } catch (error) {
    return error.message
  }
})()
const packageDirWithFlowTyped = path.join(__dirname, '../../files/with-flow-typed')
const packageDirWithTypescriptDevDependencies = path.join(__dirname, '../../files/with-typescript-dev-dependencies')
const packageDirMonoRepoRoot = path.join(__dirname, '../../files/monorepo')
const packageDirMonoRepoWithNested = path.join(__dirname, '../../files/monorepo/packages/nested-package')
const packageDirWithEmpty = path.join(__dirname, '../../files/empty')
const packageDirBundleDeps = path.join(__dirname, '../../files/bundled-dependencies/as-array-bundle-deps')
const packageDirBundledDepsAsObject = path.join(__dirname, '../../files/bundled-dependencies/as-object')
const packageDirBundledDepsRaceCondition = path.join(__dirname, '../../files/bundled-dependencies/race-condition')
const packageDirNotFoundCondition = [path.join(__dirname, '../../files/bundled-dependencies/race-condition'), path.join(__dirname, '../../files/bundled-dependencies/no-such-module')]

const {
  dependencies: deps,
  devDependencies: devDeps,
} = require('../../files/package.json')

ruleTester.run('no-extraneous-dependencies', rule, {
  valid: [
    ...flatMap(Object.keys(deps).concat(Object.keys(devDeps)), (pkg) => [
      test({ code: `import "${pkg}"` }),
      test({ code: `import foo, { bar } from "${pkg}"` }),
      test({ code: `require("${pkg}")` }),
      test({ code: `var foo = require("${pkg}")` }),
      test({ code: `export { foo } from "${pkg}"` }),
      test({ code: `export * from "${pkg}"` }),
    ]),
    test({ code: 'import "eslint"'}),
    test({ code: 'import "eslint/lib/api"'}),
    test({ code: 'import "fs"'}),
    test({ code: 'import "./foo"'}),
    test({ code: 'import "@org/package"'}),

    test({ code: 'import "electron"', settings: { 'import/core-modules': ['electron'] } }),
    test({ code: 'import "eslint"' }),
    test({
      code: 'import "eslint"',
      options: [{peerDependencies: true}],
    }),

    // 'project' type
    test({
      code: 'import "importType"',
      settings: { 'import/resolver': { node: { paths: [ path.join(__dirname, '../../files') ] } } },
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.spec.js']}],
      filename: 'foo.spec.js',
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({ code: 'require(6)' }),
    test({
      code: 'import "doctrine"',
      options: [{packageDir: path.join(__dirname, '../../../')}],
    }),
    test({
      code: 'import type MyType from "myflowtyped";',
      options: [{packageDir: packageDirWithFlowTyped}],
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import react from "react";',
      options: [{packageDir: packageDirMonoRepoWithNested}],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{packageDir: [packageDirMonoRepoWithNested, packageDirMonoRepoRoot]}],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{packageDir: packageDirMonoRepoRoot}],
    }),
    test({
      code: 'import react from "react";',
      options: [{packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested]}],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested]}],
    }),
    test({
      code: 'import rightpad from "right-pad";',
      options: [{packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested]}],
    }),
    test({ code: 'import foo from "@generated/foo"'}),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{packageDir: packageDirBundleDeps}],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{packageDir: packageDirBundledDepsAsObject}],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{packageDir: packageDirBundledDepsRaceCondition}],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{packageDir: packageDirNotFoundCondition}],
    }),
    test({ code: 'export function getToken() {}' }),
    test({ code: 'export class Component extends React.Component {}' }),
    test({ code: 'export function Component() {}' }),
    test({ code: 'export const Component = () => {}' }),
  ],
  invalid: [
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot }],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency")',
      errors: [{
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency/foo")',
      errors: [{
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "eslint"',
      options: [{devDependencies: false, peerDependencies: false}],
      errors: [{
        message: '\'eslint\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import "lodash.isarray"',
      options: [{optionalDependencies: false}],
      errors: [{
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'var foo = require("not-a-dependency")',
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var glob = require("glob")',
      options: [{devDependencies: false}],
      errors: [{
        message: '\'glob\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: 'foo.tes.js',
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: 'foo.tes.js',
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'var eslint = require("lodash.isarray")',
      options: [{optionalDependencies: false}],
      errors: [{
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{packageDir: path.join(__dirname, '../../../')}],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "bar"',
      options: [{packageDir: path.join(__dirname, './doesn-exist/')}],
      errors: [{
        message: 'The package.json file could not be found.',
      }],
    }),
    test({
      code: 'import foo from "foo"',
      options: [{packageDir: packageDirWithSyntaxError}],
      errors: [{
        message: 'The package.json file could not be parsed: ' + packageFileWithSyntaxErrorMessage,
      }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoWithNested}],
      errors: [{
        message: "'left-pad' should be listed in the project's dependencies. Run 'npm i -S left-pad' to add it",
      }],
    }),
    test({
      code: 'import react from "react";',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      errors: [{
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import react from "react";',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import "react";',
      filename: path.join(packageDirWithEmpty, 'index.js'),
      options: [{packageDir: packageDirWithEmpty}],
      errors: [{
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import bar from "@generated/bar"',
      errors: ["'@generated/bar' should be listed in the project's dependencies. Run 'npm i -S @generated/bar' to add it"],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{bundledDependencies: false}],
      errors: ["'@generated/foo' should be listed in the project's dependencies. Run 'npm i -S @generated/foo' to add it"],
    }),
    test({
      code: 'import bar from "@generated/bar"',
      options: [{packageDir: packageDirBundledDepsRaceCondition}],
      errors: ["'@generated/bar' should be listed in the project's dependencies. Run 'npm i -S @generated/bar' to add it"],
    }),
    test({
      code: 'export { foo } from "not-a-dependency";',
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'export * from "not-a-dependency";',
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
  ],
})

describe('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    const parserConfig = {
      parser: parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    }

    if (parser !== require.resolve('typescript-eslint-parser')) {
      ruleTester.run('no-extraneous-dependencies', rule, {
        valid: [
          test(Object.assign({
            code: 'import type { JSONSchema7Type } from "@types/json-schema";',
            options: [{packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
          }, parserConfig)),
        ],
        invalid: [
          test(Object.assign({
            code: 'import { JSONSchema7Type } from "@types/json-schema";',
            options: [{packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            errors: [{
              message: "'@types/json-schema' should be listed in the project's dependencies, not devDependencies.",
            }],
          }, parserConfig)),
        ],
      })
    } else {
      ruleTester.run('no-extraneous-dependencies', rule, {
        valid: [],
        invalid: [
          test(Object.assign({
            code: 'import { JSONSchema7Type } from "@types/json-schema";',
            options: [{packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            errors: [{
              message: "'@types/json-schema' should be listed in the project's dependencies, not devDependencies.",
            }],
          }, parserConfig)),
          test(Object.assign({
            code: 'import type { JSONSchema7Type } from "@types/json-schema";',
            options: [{packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            errors: [{
              message: "'@types/json-schema' should be listed in the project's dependencies, not devDependencies.",
            }],
          }, parserConfig)),
        ],
      })
    }
  })
})

if (semver.satisfies(eslintPkg.version, '>5.0.0')) {
  typescriptRuleTester.run('no-extraneous-dependencies typescript type imports', rule, {
    valid: [
      test({
        code: 'import type MyType from "not-a-dependency";',
        filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
        parser: require.resolve('babel-eslint'),
      }),
      test({
        code: 'import type { MyType } from "not-a-dependency";',
        filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
        parser: require.resolve('babel-eslint'),
      }),
    ],
    invalid: [
    ],
  })
}
