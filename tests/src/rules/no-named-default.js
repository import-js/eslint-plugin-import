import { test, testVersion, SYNTAX_CASES, getBabelParsers, getBabelParserConfig, babelSyntaxPlugins } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-named-default');

ruleTester.run('no-named-default', rule, {
  valid: [
    test({ code: 'import bar from "./bar";' }),
    test({ code: 'import bar, { foo } from "./bar";' }),

    ...SYNTAX_CASES,
  ],

  invalid: [].concat(
    /*test({
      code: 'import { default } from "./bar";',
      errors: [{
        message: 'Use default import syntax to import \'default\'.',
        type: 'Identifier',
      }],
      parser: parsers.BABEL_OLD,
    }),*/
    test({
      code: 'import { default as bar } from "./bar";',
      errors: [{
        message: 'Use default import syntax to import \'bar\'.',
        type: 'Identifier',
      }],
    }),
    test({
      code: 'import { foo, default as bar } from "./bar";',
      errors: [{
        message: 'Use default import syntax to import \'bar\'.',
        type: 'Identifier',
      }],
    }),

    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'import { "default" as bar } from "./bar";',
      errors: [{
        message: 'Use default import syntax to import \'bar\'.',
        type: 'Identifier',
      }],
      parserOptions: {
        ecmaVersion: 2022,
      },
    })) || [],
  ),
});

context('Babel Parsers', () => {
  getBabelParsers().forEach((parser) => {
    const parserConfig = getBabelParserConfig(parser, { plugins: [babelSyntaxPlugins.flow] });
    ruleTester.run('no-named-default', rule, {
      valid: [
        // Should ignore imported flow types
        test({
          code: 'import { type default as Foo } from "./bar";',
          ...parserConfig,
        }),
        test({
          code: 'import { typeof default as Foo } from "./bar";',
          ...parserConfig,
        }),
      ],
      invalid: [],
    });
  });
});
