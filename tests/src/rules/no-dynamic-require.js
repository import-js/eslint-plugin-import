import { parsers, test, testVersion, getBabelParserConfig, getBabelParsers } from '../utils';
import { RuleTester } from 'eslint';
import flatMap from 'array.prototype.flatmap';

const ruleTester = new RuleTester();
const rule = require('rules/no-dynamic-require');

const error = {
  message: 'Calls to require() should use string literals',
};

const dynamicImportError = {
  message: 'Calls to import() should use string literals',
};

ruleTester.run('no-dynamic-require', rule, {
  valid: [
    test({ code: 'import _ from "lodash"' }),
    test({ code: 'require("foo")' }),
    test({ code: 'require(`foo`)' }),
    test({ code: 'require("./foo")' }),
    test({ code: 'require("@scope/foo")' }),
    test({ code: 'require()' }),
    test({ code: 'require("./foo", "bar" + "okay")' }),
    test({ code: 'var foo = require("foo")' }),
    test({ code: 'var foo = require(`foo`)' }),
    test({ code: 'var foo = require("./foo")' }),
    test({ code: 'var foo = require("@scope/foo")' }),

    //dynamic import
    ...flatMap([parsers.ESPREE, ...getBabelParsers()], (parser) => {
      const _test =
        parser === parsers.ESPREE
          ? (testObj) => testVersion('>= 6.2.0', () => testObj)
          : (testObj) => test(testObj);
      const parserConfig = getBabelParserConfig(parser);
      parserConfig.parserOptions = { ...parserConfig.parserOptions, ecmaVersion: 2020 };
      return [].concat(
        _test({
          code: 'import("foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import(`foo`)',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import("./foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import("@scope/foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'var foo = import("foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'var foo = import(`foo`)',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'var foo = import("./foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'var foo = import("@scope/foo")',
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import("../" + name)',
          errors: [dynamicImportError],
          ...parserConfig,
        }),
        _test({
          code: 'import(`../${name}`)',
          errors: [dynamicImportError],
          ...parserConfig,
        }),
      );
    }),
  ],
  invalid: [
    test({
      code: 'require("../" + name)',
      errors: [error],
    }),
    test({
      code: 'require(`../${name}`)',
      errors: [error],
    }),
    test({
      code: 'require(name)',
      errors: [error],
    }),
    test({
      code: 'require(name())',
      errors: [error],
    }),
    test({
      code: 'require(name + "foo", "bar")',
      errors: [error],
      options: [{ esmodule: true }],
    }),

    // dynamic import
    ...flatMap([parsers.ESPREE, ...getBabelParsers()], (parser) => {
      const _test =
        parser === parsers.ESPREE
          ? (testObj) => testVersion('>= 6.2.0', () => testObj)
          : (testObj) => test(testObj);
      const parserConfig = getBabelParserConfig(parser);
      parserConfig.parserOptions = { ...parserConfig.parserOptions, ecmaVersion: 2020 };
      return [].concat(
        _test({
          code: 'import("../" + name)',
          errors: [dynamicImportError],
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import(`../${name}`)',
          errors: [dynamicImportError],
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import(name)',
          errors: [dynamicImportError],
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
        _test({
          code: 'import(name())',
          errors: [dynamicImportError],
          options: [{ esmodule: true }],
          ...parserConfig,
        }),
      );
    }),
    test({
      code: 'require(`foo${x}`)',
      errors: [error],
    }),
    test({
      code: 'var foo = require(`foo${x}`)',
      errors: [error],
    }),
  ],
});
