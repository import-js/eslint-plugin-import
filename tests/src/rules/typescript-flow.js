
import { test, getTSParsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/typescript-flow');
// TODO: add exports from .TSX files to the test cases
context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    const parserConfig = {
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    };

    const settings = {
      'import/parsers': { [parser]: ['.ts'] },
      'import/resolver': { 'eslint-import-resolver-typescript': true },
    };

    console.log(parser);
    ruleTester.run('prefer-default-export', rule, { 
      valid: [
        test({
          code: `import type { MyType } from "./typescript.ts"`,
          parser: parserConfig.parser,
          settings,
          options: [{
            prefer: 'separate',
          }],
        }),
        test({
          code: `import { type MyType } from "./typescript.ts"`,
          parser: parserConfig.parser,
          settings,
          options: [{
            prefer: 'modifier',
          }],
        }),
      ], 
      invalid: [
        test({
          code: `import type { MyType } from "./typescript.ts"`,
          parser,
          settings,
          options: [{
            prefer: 'modifier',
          }],
          errors: [{
            message: 'BOOM',
          }],
        }),
        test({
          code: `import { type MyType } from "./typescript.ts"`,
          parser,
          settings,
          options: [{
            prefer: 'separate',
          }],
          errors: [{
            message: 'BOOM',
          }],
        }),
      ] } );
  });
});
