import { test, SYNTAX_CASES } from '../utils';
import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/no-named-default');

ruleTester.run('no-named-default', rule, {
  valid: [
    test({ code: 'import bar from "./bar";' }),
    test({ code: 'import bar, { foo } from "./bar";' }),

    // Should ignore imported flow types
    test({
      code: 'import { type default as Foo } from "./bar";',
      parser: require.resolve('babel-eslint'),
    }),
    test({
      code: 'import { typeof default as Foo } from "./bar";',
      parser: require.resolve('babel-eslint'),
    }),

    ...SYNTAX_CASES,
  ],

  invalid: [
    /*test({
      code: 'import { default } from "./bar";',
      errors: [{
        message: 'Use default import syntax to import \'default\'.',
        type: 'Identifier',
      }],
      parser: require.resolve('babel-eslint'),
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
  ],
});
