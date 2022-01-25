import { test, testVersion, SYNTAX_CASES, getBabelParsers, getBabelParserConfig, babelSyntaxPlugins } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-named-as-default');

ruleTester.run('no-named-as-default', rule, {
  valid: [].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import bar, { foo } from "./bar";' }),
    test({ code: 'import bar, { foo } from "./empty-folder";' }),

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

context('Babel Parsers', () => {
  getBabelParsers().forEach((parser) => {
    const parserConfig = getBabelParserConfig(parser, { plugins: [babelSyntaxPlugins.exportDefaultFrom] });
    ruleTester.run('no-named-as-default', rule, {
      valid: [
        // es7
        test({ code: 'export bar, { foo } from "./bar";',
          ...parserConfig }),
        test({ code: 'export bar from "./bar";',
          ...parserConfig }),

        // #566: don't false-positive on `default` itself
        test({ code: 'export default from "./bar";',
          ...parserConfig }),
      ],
      invalid: [
        // es7
        test({
          code: 'export foo from "./bar";',
          errors: [ {
            message: 'Using exported name \'foo\' as identifier for default export.',
            type: 'ExportDefaultSpecifier' } ],
          ...parserConfig,
        }),
        test({
          code: 'export foo, { foo as bar } from "./bar";',
          errors: [ {
            message: 'Using exported name \'foo\' as identifier for default export.',
            type: 'ExportDefaultSpecifier' } ],
          ...parserConfig,
        }),
      ],
    });
  });
});
