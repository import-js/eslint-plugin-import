import { test, testVersion, SYNTAX_CASES, parsers } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-named-as-default');

ruleTester.run('no-named-as-default', rule, {
  valid: [].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import bar, { foo } from "./bar";' }),
    test({ code: 'import bar, { foo } from "./empty-folder";' }),

    // es7
    test({ code: 'export bar, { foo } from "./bar";',
      parser: parsers.BABEL_OLD }),
    test({ code: 'export bar from "./bar";',
      parser: parsers.BABEL_OLD }),

    // #566: don't false-positive on `default` itself
    test({ code: 'export default from "./bar";',
      parser: parsers.BABEL_OLD }),

    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'import bar, { foo } from "./export-default-string-and-named"',
      parserOptions: { ecmaVersion: 2022 },
    })),

    ...SYNTAX_CASES,
  ),

  invalid: [].concat(
    test({
      code: 'import foo from "./bar";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ImportDefaultSpecifier' } ] }),
    test({
      code: 'import foo, { foo as bar } from "./bar";',
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ImportDefaultSpecifier' } ] }),

    // es7
    test({
      code: 'export foo from "./bar";',
      parser: parsers.BABEL_OLD,
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ExportDefaultSpecifier' } ] }),
    test({
      code: 'export foo, { foo as bar } from "./bar";',
      parser: parsers.BABEL_OLD,
      errors: [ {
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ExportDefaultSpecifier' } ] }),

    test({
      code: 'import foo from "./malformed.js"',
      errors: [{
        message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
        type: 'Literal',
      }],
    }),

    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'import foo from "./export-default-string-and-named"',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ImportDefaultSpecifier',
      }],
      parserOptions: { ecmaVersion: 2022 },
    })),
    testVersion('>= 8.7', () => ({
      code: 'import foo, { foo as bar } from "./export-default-string-and-named"',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ImportDefaultSpecifier',
      }],
      parserOptions: { ecmaVersion: 2022 },
    })),
  ),
});
