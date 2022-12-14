
import { test, getTSParsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/typescript-flow');
// TODO: add imports from .TSX files to the test cases
context('TypeScript', function () {
  // Do we need to check for different TS parsers? TODO Question
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
          code: `import type { MyType, Bar } from "./typescript.ts"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import type { MyType as Foo } from "./typescript.ts"`,
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
        // default imports are ignored for strict option separate. Question. TODO
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
        test({
          code: `import { type MyType } from "./typescript.ts"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType as Persona } from "./typescript.ts"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType, Bar, MyEnum } from "./typescript.ts"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType as Persona, Bar as Bar, MyEnum } from "./typescript.ts"`,
          parser,
          settings,
          options: ['inline'],
        }),
      ], 
      invalid: [
        test({
          code: 'import {type MyType,Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType as Persona } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,Bar,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType, Foo } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar,type Foo as Baz} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType as Persona, Foo as Baz } from "./typescript.ts"',
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
        // the space is left over when 'type' is removed. Question. TODO
        test({
          code: 'import type {MyType} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import  {type MyType} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import  {type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import {MyEnum} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {MyEnum, type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./typescript.ts";import {MyEnum} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {MyEnum, type MyType as Persona, type Bar as Foo} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import {default as B} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import {default as B, type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import defaultExport from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import defaultExport, { type MyType, type Bar } from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./typescript.ts";import defaultExport from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import defaultExport, { type MyType as Persona, type Bar as Foo } from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import * as b from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: 'BOOM',
          }],
          output: 'import  {type MyType, type Bar} from "./typescript.ts";import * as b from "./typescript.ts"',
        }),
        // TODO: Fix the one below
        // test({
        //   code: 'import type {MyType, Bar} from "./typescript.ts";import type A from "./typescript.ts"',
        //   parser,
        //   settings,
        //   options: ['inline'],
        //   errors: [{
        //     message: 'BOOM',
        //   }],
        //   output: 'import  {type MyType, type Bar} from "./typescript.ts";import type A from "./typescript.ts"',
        // }),
      ] },
    );
  });
});
