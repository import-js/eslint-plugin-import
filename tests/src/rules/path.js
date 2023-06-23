import { test, getTSParsers, testFilePath } from '../utils';

import { RuleTester } from 'eslint';
import { resolve } from 'path';

const ruleTester = new RuleTester();
const rule = require('rules/path');

function createTest(parser) {
  return {
    filename: testFilePath('./path/home/foo.ts'),
    parser,
    settings: {
      'import/parsers': { [parser]: ['.ts'] },
      'import/resolver': { 'eslint-import-resolver-typescript': true },
    },
    parserOptions: {
      tsconfigRootDir: resolve(__dirname, '../../files/path/'),
    },
  };
}

context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    ruleTester.run('path', rule, {
      valid: [
        test({
          ...createTest(parser),
          code: 'import bar from "./sub/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "home/sub/bar"',
          options: [{ underSameDirectory: 'relativeToRoot' }],
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "../other/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "other/bar"',
          options: [{ other: 'relativeToRoot' }],
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "other/bar"',
          parserOptions: {},
          options: [{ other: 'relativeToRoot', root: resolve(__dirname, '../../files/path/') }],
        }),
      ],

      invalid: [
        test({
          ...createTest(parser),
          code: 'import bar from "home/sub/bar"',
          errors: ['Imports under the same directory of the current file must be relative to the current file.'],
          output: 'import bar from "./sub/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "./sub/bar"',
          options: [{ underSameDirectory: 'relativeToRoot' }],
          errors: ['Imports under the same directory of the current file must be relative to the project root.'],
          output: 'import bar from "home/sub/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "other/bar"',
          errors: ['Imports not under the same directory of the current file must be relative to the current file.'],
          output: 'import bar from "../other/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "../other/bar"',
          options: [{ other: 'relativeToRoot' }],
          errors: ['Imports not under the same directory of the current file must be relative to the project root.'],
          output: 'import bar from "other/bar"',
        }),
        test({
          ...createTest(parser),
          code: 'import bar from "other/bar"',
          parserOptions: {},
          options: [{ other: 'relativeToRoot' }],
          errors: ['Imports cannot be relative to the project root because the project root is not defined.'],
        }),
      ],
    });
  });
});
