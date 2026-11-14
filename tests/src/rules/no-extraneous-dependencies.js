import { getTSParsers, parsers, test, testFilePath } from '../utils';
import typescriptConfig from '../../../config/typescript';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { RuleTester } from '../rule-tester';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester();
const typescriptRuleTester = new RuleTester(typescriptConfig);
const rule = require('rules/no-extraneous-dependencies');

const packageDirWithSyntaxError = path.join(__dirname, '../../files/with-syntax-error');
const packageFileWithSyntaxErrorMessage = (() => {
  try {
    JSON.parse(fs.readFileSync(path.join(packageDirWithSyntaxError, 'package.json')));
  } catch (error) {
    return error.message;
  }
})();
const packageDirWithFlowTyped = path.join(__dirname, '../../files/with-flow-typed');
const packageDirWithTypescriptDevDependencies = path.join(__dirname, '../../files/with-typescript-dev-dependencies');
const packageDirWithResolvedTypesDependencies = path.join(__dirname, '../../files/with-resolved-types-dependencies');
const packageDirMonoRepoRoot = path.join(__dirname, '../../files/monorepo');
const packageDirMonoRepoWithNested = path.join(__dirname, '../../files/monorepo/packages/nested-package');
const packageDirWithEmpty = path.join(__dirname, '../../files/empty');
const packageDirBundleDeps = path.join(__dirname, '../../files/bundled-dependencies/as-array-bundle-deps');
const packageDirBundledDepsAsObject = path.join(__dirname, '../../files/bundled-dependencies/as-object');
const packageDirBundledDepsRaceCondition = path.join(__dirname, '../../files/bundled-dependencies/race-condition');
const emptyPackageDir = path.join(__dirname, '../../files/empty-folder');

const {
  dependencies: deps,
  devDependencies: devDeps,
} = require('../../files/package.json');

// #3311: the linted file has to exist. The node resolver stops when a parent
// directory is missing, and then this rule never reaches the glob check.
// `fs.mkdirSync(path, { recursive: true })` is Node 10.12+, and
// `fs.mkdtempSync` is Node 5.10 / 6.2. CI still runs Node 4, where the
// latter throws, and Node 6, 7, 8, and 9, which ignore the options object
// and then throw ENOENT on a nested path.
function mkdirpSync(dir) {
  if (fs.existsSync(dir)) {
    return;
  }
  const parent = path.dirname(dir);
  if (parent !== dir) {
    mkdirpSync(parent);
  }
  try {
    fs.mkdirSync(dir);
  } catch (error) {
    if (!error || error.code !== 'EEXIST') {
      throw error;
    }
  }
}
function makeTempDir(prefix) {
  const root = os.tmpdir();
  let attempt = 0;
  while (attempt < 16) {
    attempt += 1;
    const dir = path.join(root, prefix + Date.now().toString(36) + Math.random().toString(36).slice(2));
    try {
      fs.mkdirSync(dir);
      return dir;
    } catch (error) {
      if (!error || error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  throw new Error('Could not create the #3311 fixture directory');
}
const dotGlobFixture = makeTempDir('eslint-plugin-import-3311-');
mkdirpSync(path.join(dotGlobFixture, '.worktrees/feature/libs/my-lib/src'));
mkdirpSync(path.join(dotGlobFixture, '.worktrees/feature/apps/my-app/src'));
fs.writeFileSync(path.join(dotGlobFixture, 'package.json'), `${JSON.stringify({
  devDependencies: { glob: '1.0.0', eslint: '1.0.0' },
  peerDependencies: { eslint: '1.0.0' },
})}\n`);
fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(dotGlobFixture, 'node_modules'), 'dir');
const dotGlobLibFile = path.join(dotGlobFixture, '.worktrees/feature/libs/my-lib/src/index.ts');
const dotGlobAppFile = path.join(dotGlobFixture, '.worktrees/feature/apps/my-app/src/index.ts');
fs.writeFileSync(dotGlobLibFile, '');
fs.writeFileSync(dotGlobAppFile, '');

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
    test({ code: 'import "eslint/lib/api"' }),
    test({ code: 'import "fs"' }),
    test({ code: 'import "./foo"' }),

    test({ code: 'import "electron"', settings: { 'import/core-modules': ['electron'] } }),
    test({
      code: 'import "eslint"',
      options: [{ peerDependencies: true }],
    }),

    // 'project' type
    test({
      code: 'import "importType"',
      settings: { 'import/resolver': { node: { paths: [path.join(__dirname, '../../files')] } } },
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.spec.js'] }],
      filename: 'foo.spec.js',
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.spec.js'] }],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.test.js', '*.spec.js'] }],
      filename: path.join(process.cwd(), 'foo.spec.js'),
    }),
    // #3311: globs must match through a directory whose name starts with a dot
    test({
      code: 'import "glob"',
      options: [{ devDependencies: ['**/libs/**/*.ts'] }],
      filename: dotGlobLibFile,
    }),
    test({
      code: 'import "eslint"',
      options: [{
        devDependencies: false,
        peerDependencies: ['**/libs/**/*.ts'],
      }],
      filename: dotGlobLibFile,
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.spec.js'] }],
      filename: path.join(process.cwd(), '.hidden.spec.js'),
    }),
    test({ code: 'require(6)' }),
    test({
      code: 'import "doctrine"',
      options: [{ packageDir: path.join(__dirname, '../../../') }],
    }),
    test({
      code: 'import type MyType from "myflowtyped";',
      options: [{ packageDir: packageDirWithFlowTyped }],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `
        // @flow
        import typeof TypeScriptModule from 'typescript';
      `,
      options: [{ packageDir: packageDirWithFlowTyped }],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import react from "react";',
      options: [{ packageDir: packageDirMonoRepoWithNested }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{ packageDir: [packageDirMonoRepoWithNested, packageDirMonoRepoRoot] }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{ packageDir: packageDirMonoRepoRoot }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{ packageDir: [emptyPackageDir, packageDirMonoRepoRoot] }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{ packageDir: [packageDirMonoRepoRoot, emptyPackageDir] }],
    }),
    test({
      code: 'import react from "react";',
      options: [{ packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested] }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      options: [{ packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested] }],
    }),
    test({
      code: 'import rightpad from "right-pad";',
      options: [{ packageDir: [packageDirMonoRepoRoot, packageDirMonoRepoWithNested] }],
    }),
    test({ code: 'import foo from "@generated/foo"' }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{ packageDir: packageDirBundleDeps }],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{ packageDir: packageDirBundledDepsAsObject }],
    }),
    test({
      code: 'import foo from "@generated/foo"',
      options: [{ packageDir: packageDirBundledDepsRaceCondition }],
    }),
    test({ code: 'export function getToken() {}' }),
    test({ code: 'export class Component extends React.Component {}' }),
    test({ code: 'export function Component() {}' }),
    test({ code: 'export const Component = () => {}' }),

    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      options: [{ packageDir: packageDirMonoRepoRoot }],
      settings: { 'import/core-modules': ['not-a-dependency'] },
    }),
    test({
      code: 'import "@generated/bar/module"',
      settings: { 'import/core-modules': ['@generated/bar'] },
    }),
    test({
      code: 'import "@generated/bar/and/sub/path"',
      settings: { 'import/core-modules': ['@generated/bar'] },
    }),
    // check if "rxjs" dependency declaration fix the "rxjs/operators subpackage
    test({
      code: 'import "rxjs/operators"',
    }),

    test({
      code: 'import "esm-package/esm-module";',
    }),

    test({
      code: `
        import "alias/esm-package/esm-module";
        import 'expose-loader?exposes[]=$&exposes[]=jQuery!jquery';
      `,
      settings: { 'import/resolver': 'webpack' },
    }),

    test({
      code: 'import "@custom-internal-alias/api/service";',
      settings: {
        'import/resolver': {
          webpack: {
            config: {
              resolve: {
                alias: {
                  '@custom-internal-alias': testFilePath('internal-modules'),
                },
              },
            },
          },
        },
      },
    }),

    // Alias that resolves outside the current package root but not in node_modules.
    // Simulates a monorepo sibling package accessed via a webpack alias.
    // The alias target (internal-modules/) is outside alias-outside-package/'s root.
    test({
      code: 'import "my-alias/api/service";',
      filename: testFilePath('alias-outside-package/foo.js'),
      settings: {
        'import/resolver': {
          webpack: {
            config: {
              resolve: {
                alias: {
                  'my-alias': testFilePath('internal-modules'),
                },
              },
            },
          },
        },
      },
    }),
  ],
  invalid: [
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoRoot, 'foo.js'),
      options: [{ packageDir: packageDirMonoRepoRoot }],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{ packageDir: packageDirMonoRepoRoot }],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{ packageDir: packageDirMonoRepoRoot }],
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
      options: [{ devDependencies: false, peerDependencies: false }],
      errors: [{
        message: '\'eslint\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import "lodash.isarray"',
      options: [{ optionalDependencies: false }],
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
      options: [{ devDependencies: false }],
      errors: [{
        message: '\'glob\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.test.js'] }],
      filename: 'foo.tes.js',
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.test.js'] }],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.test.js', '*.spec.js'] }],
      filename: 'foo.tes.js',
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import chai from "chai"',
      options: [{ devDependencies: ['*.test.js', '*.spec.js'] }],
      filename: path.join(process.cwd(), 'foo.tes.js'),
      errors: [{
        message: '\'chai\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'import "glob"',
      options: [{ devDependencies: ['**/libs/**/*.ts'] }],
      filename: dotGlobAppFile,
      errors: [{
        message: '\'glob\' should be listed in the project\'s dependencies, not devDependencies.',
      }],
    }),
    test({
      code: 'var eslint = require("lodash.isarray")',
      options: [{ optionalDependencies: false }],
      errors: [{
        message: '\'lodash.isarray\' should be listed in the project\'s dependencies, not optionalDependencies.',
      }],
    }),
    test({
      code: 'import "not-a-dependency"',
      options: [{ packageDir: path.join(__dirname, '../../../') }],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
    test({
      code: 'import "bar"',
      options: [{ packageDir: path.join(__dirname, './doesn-exist/') }],
      errors: [{
        message: 'The package.json file could not be found.',
      }],
    }),
    test({
      code: 'import foo from "foo"',
      options: [{ packageDir: packageDirWithSyntaxError }],
      errors: [{
        message: `The package.json file could not be parsed: ${packageFileWithSyntaxErrorMessage}`,
      }],
    }),
    test({
      code: 'import leftpad from "left-pad";',
      filename: path.join(packageDirMonoRepoWithNested, 'foo.js'),
      options: [{ packageDir: packageDirMonoRepoWithNested }],
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
      options: [{ packageDir: packageDirMonoRepoRoot }],
      errors: [{
        message: "'react' should be listed in the project's dependencies. Run 'npm i -S react' to add it",
      }],
    }),
    test({
      code: 'import "react";',
      filename: path.join(packageDirWithEmpty, 'index.js'),
      options: [{ packageDir: packageDirWithEmpty }],
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
      options: [{ bundledDependencies: false }],
      errors: ["'@generated/foo' should be listed in the project's dependencies. Run 'npm i -S @generated/foo' to add it"],
    }),
    test({
      code: 'import bar from "@generated/bar"',
      options: [{ packageDir: packageDirBundledDepsRaceCondition }],
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
    test({
      code: 'import chai from "alias/chai";',
      settings: { 'import/resolver': 'webpack' },
      errors: [{
        // missing dependency is chai not alias
        message: "'chai' should be listed in the project's dependencies. Run 'npm i -S chai' to add it",
      }],
    }),

    // https://github.com/import-js/eslint-plugin-import/issues/3208
    // when `qs` resolves only through the `@types/qs` devDependency, the missing
    // runtime package is `qs`, not the `@types/qs` package the resolver landed on
    test({
      code: 'import qs from "qs";',
      filename: path.join(packageDirWithResolvedTypesDependencies, 'foo.js'),
      options: [{ packageDir: packageDirWithResolvedTypesDependencies, devDependencies: false }],
      errors: [{
        message: "'qs' should be listed in the project's dependencies. Run 'npm i -S qs' to add it",
      }],
    }),

    test({
      code: 'import babel from "@babel/core";',
      filename: path.join(packageDirWithResolvedTypesDependencies, 'foo.js'),
      options: [{ packageDir: packageDirWithResolvedTypesDependencies, devDependencies: false }],
      errors: [{
        message: "'@babel/core' should be listed in the project's dependencies. Run 'npm i -S @babel/core' to add it",
      }],
    }),

    test({
      code: 'import "esm-package-not-in-pkg-json/esm-module";',
      errors: [{
        message: `'esm-package-not-in-pkg-json' should be listed in the project's dependencies. Run 'npm i -S esm-package-not-in-pkg-json' to add it`,
      }],
    }),

    test({
      code: 'import "not-a-dependency"',
      settings: {
        'import/resolver': { node: { paths: [path.join(__dirname, '../../files')] } },
        'import/internal-regex': '^not-a-dependency.*',
      },
      options: [{ includeInternal: true }],
      errors: [{
        message: '\'not-a-dependency\' should be listed in the project\'s dependencies. Run \'npm i -S not-a-dependency\' to add it',
      }],
    }),
  ],
});

describe('TypeScript', () => {
  getTSParsers()
    // Type-only imports were added in TypeScript ESTree 2.23.0
    .filter((parser) => parser !== parsers.TS_OLD)
    .forEach((parser) => {
      const parserConfig = {
        parser,
        settings: {
          'import/parsers': { [parser]: ['.ts'] },
          'import/resolver': ['node', 'typescript'],
        },
      };

      ruleTester.run('no-extraneous-dependencies', rule, {
        valid: [
          test({
            code: 'import type T from "a";',
            options: [{ packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            ...parserConfig,
          }),

          test({
            code: 'import type { T } from "a"; export type { T };',
            options: [{ packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            ...parserConfig,
          }),

          test({
            code: 'export type { T } from "a";',
            options: [{ packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            ...parserConfig,
          }),
        ],
        invalid: [
          test({
            code: 'import T from "a";',
            options: [{ packageDir: packageDirWithTypescriptDevDependencies, devDependencies: false }],
            errors: [{ message: "'a' should be listed in the project's dependencies, not devDependencies." }],
            ...parserConfig,
          }),

          test({ code: 'import type T from "a";',
            options: [{
              packageDir: packageDirWithTypescriptDevDependencies,
              devDependencies: false,
              includeTypes: true,
            }],
            errors: [{ message: "'a' should be listed in the project's dependencies, not devDependencies." }],
            ...parserConfig,
          }),
        ],
      });
    });
});

typescriptRuleTester.run('no-extraneous-dependencies typescript type imports', rule, {
  valid: [
    test({
      code: 'import type MyType from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import type { MyType } from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import { type MyType } from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'import { type MyType, type OtherType } from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
    }),
  ],
  invalid: [
    test({
      code: 'import type { MyType } from "not-a-dependency";',
      options: [{ includeTypes: true }],
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
      errors: [{
        message: `'not-a-dependency' should be listed in the project's dependencies. Run 'npm i -S not-a-dependency' to add it`,
      }],
    }),
    test({
      code: `import type { Foo } from 'not-a-dependency';`,
      options: [{ includeTypes: true }],
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
      errors: [{
        message: `'not-a-dependency' should be listed in the project's dependencies. Run 'npm i -S not-a-dependency' to add it`,
      }],
    }),
    test({
      code: 'import Foo, { type MyType } from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
      errors: [{
        message: `'not-a-dependency' should be listed in the project's dependencies. Run 'npm i -S not-a-dependency' to add it`,
      }],
    }),
    test({
      code: 'import { type MyType, Foo } from "not-a-dependency";',
      filename: testFilePath('./no-unused-modules/typescript/file-ts-a.ts'),
      parser: parsers.BABEL_OLD,
      errors: [{
        message: `'not-a-dependency' should be listed in the project's dependencies. Run 'npm i -S not-a-dependency' to add it`,
      }],
    }),
  ],
});
