import { test } from '../utils'
import * as path from 'path'
import * as fs from 'fs'

import { RuleTester } from 'eslint'
const ruleTester = new RuleTester()
    , rule = require('rules/no-extraneous-dependencies')

const packageDirWithSyntaxError = path.join(__dirname, '../../files/with-syntax-error')
const packageFileWithSyntaxErrorMessage = (() => {
  try {
    JSON.parse(fs.readFileSync(path.join(packageDirWithSyntaxError, 'package.json')))
  } catch (error) {
    return error.message
  }
})()
const packageDirWithFlowTyped = path.join(__dirname, '../../files/with-flow-typed')
const packageDirMonoRepoRoot = path.join(__dirname, '../../files/monorepo')
const packageDirMonoRepoWithNested = path.join(__dirname, '../../files/monorepo/packages/nested-package')
const packageDirWithEmpty = path.join(__dirname, '../../files/empty')
const packageDirBundleDeps = path.join(__dirname, '../../files/bundled-dependencies/as-array-bundle-deps')
const packageDirBundledDepsAsObject = path.join(__dirname, '../../files/bundled-dependencies/as-object')
const packageDirBundledDepsRaceCondition = path.join(__dirname, '../../files/bundled-dependencies/race-condition')

ruleTester.run('no-extraneous-dependencies', rule, {
  valid: [
    test({ code: 'import "lodash.cond"'}),
    test({ code: 'import "pkg-up"'}),
    test({ code: 'import foo, { bar } from "lodash.cond"'}),
    test({ code: 'import foo, { bar } from "pkg-up"'}),
    test({ code: 'import "eslint"'}),
    test({ code: 'import "eslint/lib/api"'}),
    test({ code: 'require("lodash.cond")'}),
    test({ code: 'require("pkg-up")'}),
    test({ code: 'var foo = require("lodash.cond")'}),
    test({ code: 'var foo = require("pkg-up")'}),
    test({ code: 'import "fs"'}),
    test({ code: 'import "./foo"'}),
    test({ code: 'import "lodash.isarray"'}),
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
      code: 'import leftpad from "left-pad";',
      options: [{packageDir: [packageDirMonoRepoWithNested, packageDirMonoRepoRoot]}],
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
    test({ code: 'export { foo } from "lodash.cond"' }),
    test({ code: 'export * from "lodash.cond"' }),
    test({ code: 'export function getToken() {}' }),
    test({
      code: 'import "not-a-dependency"',
      options: [{whitelist: ['not-a-dependency']}],
    }),
    test({
      code: 'export { foo } from "@org/not-a-dependency";',
      options: [{whitelist: ['@org/not-a-dependency']}],
    }),
    test({
      code: 'export * from "@org/not-a-dependency/foo";',
      options: [{whitelist: ['@org/not-a-dependency']}],
    }),
    test({
      code: 'var foo = require("glob")',
      options: [{devDependencies: false, whitelist: ['glob']}],
    }),
  ],
  invalid: [
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot }],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var donthaveit = require("@org/not-a-dependency/foo")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'@org/not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S @org/not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "eslint"',
      options: [{devDependencies: false, peerDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'eslint\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import "lodash.isarray"',
      options: [{optionalDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'var foo = require("not-a-dependency")',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'var glob = require("glob")',
      options: [{devDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'glob\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: 'foo.tes.js',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: 'foo.tes.js',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{devDependencies: ['*.test.js', '*.spec.js']}],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'var eslint = require("lodash.isarray")',
      options: [{optionalDependencies: false}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{packageDir: path.join(__dirname, '../../../')}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "bar"',
      options: [{packageDir: path.join(__dirname, './doesn-exist/')}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'The package.json file could not be found.',
      }],
    }),
    test({
      code: 'import foo from "foo"',
      options: [{packageDir: packageDirWithSyntaxError}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: 'The package.json file could not be parsed: ' + packageFileWithSyntaxErrorMessage,
      }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoWithNested}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: "'left-pad' should be listed in the project's dependencies. Run 'npm i -S left-pad' to add it",
      }],
    }),
    test({
      code: 'import react from "react";',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import react from "react";',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import "react";',
      filename: path.join(packageDirWithEmpty, 'index.js'),
      options: [{packageDir: packageDirWithEmpty}],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
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
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'export * from "not-a-dependency";',
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      options: [{packageDir: packageDirMonoRepoRoot, whitelist: ['an-unused-dependency'] }],
      errors: [{
        ruleId: 'no-extraneous-dependencies',
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
  ],
})
