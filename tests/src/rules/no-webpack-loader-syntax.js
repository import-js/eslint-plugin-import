import { test, getTSParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';
import semver from 'semver';

const ruleTester = new RuleTester();
const rule = require('rules/no-webpack-loader-syntax');

const message = 'Do not use import syntax to configure webpack loaders.';

ruleTester.run('no-webpack-loader-syntax', rule, {
  valid: [
    test({ code: 'import _ from "lodash"' }),
    test({ code: 'import find from "lodash.find"' }),
    test({ code: 'import foo from "./foo.css"' }),
    test({ code: 'import data from "@scope/my-package/data.json"' }),
    test({ code: 'var _ = require("lodash")' }),
    test({ code: 'var find = require("lodash.find")' }),
    test({ code: 'var foo = require("./foo")' }),
    test({ code: 'var foo = require("../foo")' }),
    test({ code: 'var foo = require("foo")' }),
    test({ code: 'var foo = require("./")' }),
    test({ code: 'var foo = require("@scope/foo")' }),
  ],
  invalid: [
    test({
      code: 'import _ from "babel!lodash"',
      errors: [
        { message: `Unexpected '!' in 'babel!lodash'. ${message}` },
      ],
    }),
    test({
      code: 'import find from "-babel-loader!lodash.find"',
      errors: [
        { message: `Unexpected '!' in '-babel-loader!lodash.find'. ${message}` },
      ],
    }),
    test({
      code: 'import foo from "style!css!./foo.css"',
      errors: [
        { message: `Unexpected '!' in 'style!css!./foo.css'. ${message}` },
      ],
    }),
    test({
      code: 'import data from "json!@scope/my-package/data.json"',
      errors: [
        { message: `Unexpected '!' in 'json!@scope/my-package/data.json'. ${message}` },
      ],
    }),
    test({
      code: 'var _ = require("babel!lodash")',
      errors: [
        { message: `Unexpected '!' in 'babel!lodash'. ${message}` },
      ],
    }),
    test({
      code: 'var find = require("-babel-loader!lodash.find")',
      errors: [
        { message: `Unexpected '!' in '-babel-loader!lodash.find'. ${message}` },
      ],
    }),
    test({
      code: 'var foo = require("style!css!./foo.css")',
      errors: [
        { message: `Unexpected '!' in 'style!css!./foo.css'. ${message}` },
      ],
    }),
    test({
      code: 'var data = require("json!@scope/my-package/data.json")',
      errors: [
        { message: `Unexpected '!' in 'json!@scope/my-package/data.json'. ${message}` },
      ],
    }),
  ],
});

context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    const parserConfig = {
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    };
    // @typescript-eslint/parser@5+ throw error for invalid module specifiers at parsing time.
    // https://github.com/typescript-eslint/typescript-eslint/releases/tag/v5.0.0
    if (!(parser === parsers.TS_NEW && semver.satisfies(require('@typescript-eslint/parser/package.json').version, '>= 5'))) {
      ruleTester.run('no-webpack-loader-syntax', rule, {
        valid: [
          test(Object.assign({
            code: 'import { foo } from\nalert()',
          }, parserConfig)),
          test(Object.assign({
            code: 'import foo from\nalert()',
          }, parserConfig)),
        ],
        invalid: [],
      });
    }
  });
});
