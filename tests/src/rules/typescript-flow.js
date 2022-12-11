
import { test, getTSParsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/typescript-flow');
// TODO: add exports from .TSX files to the test cases, import default, import * as b statement
context('TypeScript', function () {
  getTSParsers().forEach((parser) => {
    // const parserConfig = {
    //   parser,
    //   settings: {
    //     'import/parsers': { [parser]: ['.ts'] },
    //     'import/resolver': { 'eslint-import-resolver-typescript': true },
    //   },
    // };

    const settings = {
      'import/parsers': { [parser]: ['.ts'] },
      'import/resolver': { 'eslint-import-resolver-typescript': true },
    };

    ruleTester.run('typescript-flow', rule, { 
      valid: [
        test({
          code: `import type { MyType } from "./typescript.ts"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import * as Bar from "./typescript.ts"`,
          parser,
          settings,
          options: ['separate'],
        }),
        // default import is ignored for now
        test({
          code: `import Bar from "./typescript.ts"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import type Bar from "./typescript.ts"`,
          parser,
          settings,
          options: ['separate'],
        }),
        // test({
        //   code: `import { MyType } from "./typescript.ts"`,
        //   parser,
        //   settings,
        //   options: [{
        //     prefer: 'modifier',
        //   }],
        // }),
      ], 
      invalid: [
        // test({
        //   code: `import type { MyType, Bar } from "./typescript.ts"`,
        //   parser,
        //   settings,
        //   options: ['none'],
        //   errors: [{
        //     message: 'BOOM',
        //   }],
        //   output: 'import { MyType, Bar } from "./typescript.ts"',
        // }),
        // test({
        //   code: 'import { type MyType, Bar } from "./typescript.ts"',
        //   parser,
        //   settings,
        //   options: ['none'],
        //   errors: [{
        //     message: 'BOOM',
        //   }],
        //   output: 'import { MyType, Bar } from "./typescript.ts"',
        // }),
        // test({
        //   code: 'import { MyType, type Bar } from "./typescript.ts"',
        //   parser,
        //   settings,
        //   options: ['none'],
        //   errors: [{
        //     message: 'BOOM',
        //   }],
        //   output: 'import { MyType, Bar } from "./typescript.ts"',
        // }),
        // test({
        //   code: 'import { type MyType, type Bar } from "./typescript.ts"',
        //   parser,
        //   settings,
        //   options: ['none'],
        //   errors: [{
        //     message: 'BOOM',
        //   },
        //   {
        //     message: 'BOOM',
        //   }],
        //   output: 'import { MyType, Bar } from "./typescript.ts"',
        // }),

        test({
          code: 'import {type MyType,Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          // Question: Do we just remove the problematic node, what about comma? // import { type MyType, Bar, type Foo } => mport { , Bar,  }
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
          //output: 'import type { Bar } from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,Bar,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          // Question: Do we just remove the problematic node, what about comma? // import { type MyType, Bar, type Foo } => mport { , Bar,  }
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType, Foo } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,Bar as Namespace} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {Bar as Namespace} from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import type { MyType, Foo} from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Bar,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import type { MyType as Bar, Foo} from "./typescript.ts"',
        }),
      ] },
    );
  });
});
