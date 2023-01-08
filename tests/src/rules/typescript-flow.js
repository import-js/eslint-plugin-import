
import { test, getTSParsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/typescript-flow');

const SEPARATE_ERROR_MESSAGE = 'Type imports should be separately imported.';
const INLINE_ERROR_MESSAGE = 'Type imports should be imported inline with type modifier.';

context('TypeScript', function () {
  // Do we need to check for different TS parsers? TODO Question
  getTSParsers().forEach((parser) => {

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
        // the same imports from TSX file
        test({
          code: `import type { MyType } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import type { MyType, Bar } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import type { MyType as Foo } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import * as Bar from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import Bar from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import type Bar from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['separate'],
        }),
        test({
          code: `import { type MyType } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType as Persona } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType, Bar, MyEnum } from "./tsx-type-exports.tsx"`,
          parser,
          settings,
          options: ['inline'],
        }),
        test({
          code: `import { type MyType as Persona, Bar as Bar, MyEnum } from "./tsx-type-exports.tsx"`,
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
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType as Persona } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,Bar,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType, Foo } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar,type Foo as Baz} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./typescript.ts"\nimport type { MyType as Persona, Foo as Baz } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,Bar as Namespace} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar as Namespace} from "./typescript.ts"\nimport type { MyType } from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import type { MyType, Foo} from "./typescript.ts"',
        }),
        test({
          code: 'import {type MyType as Bar,type Foo} from "./typescript.ts"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import type { MyType as Bar, Foo} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import {MyEnum} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {MyEnum, type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./typescript.ts";import {MyEnum} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {MyEnum, type MyType as Persona, type Bar as Foo} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import {default as B} from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {default as B, type MyType, type Bar} from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import defaultExport from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import defaultExport, { type MyType, type Bar } from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./typescript.ts";import defaultExport from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import defaultExport, { type MyType as Persona, type Bar as Foo } from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import * as b from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./typescript.ts";import * as b from "./typescript.ts"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./typescript.ts";import type A from "./typescript.ts"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./typescript.ts";import type A from "./typescript.ts"',
        }),
        // TSX cases
        test({
          code: 'import {type MyType,Bar} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./tsx-type-exports.tsx"\nimport type { MyType } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./tsx-type-exports.tsx"\nimport type { MyType as Persona } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType,Bar,type Foo} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./tsx-type-exports.tsx"\nimport type { MyType, Foo } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType as Persona,Bar,type Foo as Baz} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar} from "./tsx-type-exports.tsx"\nimport type { MyType as Persona, Foo as Baz } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType,Bar as Namespace} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import {Bar as Namespace} from "./tsx-type-exports.tsx"\nimport type { MyType } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType,type Foo} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import type { MyType, Foo} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import {type MyType as Bar,type Foo} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['separate'],
          errors: [{
            message: SEPARATE_ERROR_MESSAGE,
          }],
          output: 'import type { MyType as Bar, Foo} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx";import {MyEnum} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {MyEnum, type MyType, type Bar} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./tsx-type-exports.tsx";import {MyEnum} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {MyEnum, type MyType as Persona, type Bar as Foo} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx";import {default as B} from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import {default as B, type MyType, type Bar} from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx";import defaultExport from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import defaultExport, { type MyType, type Bar } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType as Persona, Bar as Foo} from "./tsx-type-exports.tsx";import defaultExport from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import defaultExport, { type MyType as Persona, type Bar as Foo } from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx";import * as b from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./tsx-type-exports.tsx";import * as b from "./tsx-type-exports.tsx"',
        }),
        test({
          code: 'import type {MyType, Bar} from "./tsx-type-exports.tsx";import type A from "./tsx-type-exports.tsx"',
          parser,
          settings,
          options: ['inline'],
          errors: [{
            message: INLINE_ERROR_MESSAGE,
          }],
          output: 'import  {type MyType, type Bar} from "./tsx-type-exports.tsx";import type A from "./tsx-type-exports.tsx"',
        }),
      ],
    },
    );
  });
});
