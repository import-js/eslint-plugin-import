
import { test, getTSParsers, parsers } from '../utils';

import { RuleTester } from 'eslint';
import semver from 'semver';

const ruleTester = new RuleTester();
const rule = require('rules/typescript-flow');

const message = 'Do not use import syntax to configure webpack loaders.';

context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    const parserConfig = {
      parser,
      settings: {
        'import/parsers': { [parser]: ['.ts'] },
        'import/resolver': { 'eslint-import-resolver-typescript': true },
      },
    };

    console.log(parser);
    ruleTester.run('prefer-default-export', rule, { 
      valid: [
        test({
          code: `import type { MyType } from "./typescript.ts"`,
          parser,
          settings: {
            'import/parsers': { [parser]: ['.ts'] },
            'import/resolver': { 'eslint-import-resolver-typescript': true },
          },
        //   parserConfig,
        }),
      ], 
      invalid: [
        test({
          code: `import { MyType } from "./typescript.ts"`,
        //   parserConfig,
        parser,
        settings: {
          'import/parsers': { [parser]: ['.ts'] },
          'import/resolver': { 'eslint-import-resolver-typescript': true },
        },
          errors: [{
            message: 'BOOM',
          }], 
        }),
      ] } );
    // @typescript-eslint/parser@5+ throw error for invalid module specifiers at parsing time.
    // https://github.com/typescript-eslint/typescript-eslint/releases/tag/v5.0.0
    // if (!(parser === parsers.TS_NEW && semver.satisfies(require('@typescript-eslint/parser/package.json').version, '>= 5'))) {
    //   ruleTester.run('no-webpack-loader-syntax', rule, {
    //     valid: [
    //       test(Object.assign({
    //         code: 'import { foo } from\nalert()',
    //       }, parserConfig)),
    //       test(Object.assign({
    //         code: 'import foo from\nalert()',
    //       }, parserConfig)),
    //     ],
    //     invalid: [],
    //   });
    // }

  });
});
