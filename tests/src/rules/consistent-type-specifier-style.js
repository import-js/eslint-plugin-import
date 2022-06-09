import { RuleTester } from 'eslint';
import { test, parsers, tsVersionSatisfies, eslintVersionSatisfies, typescriptEslintParserSatisfies } from '../utils';

const rule = require('rules/consistent-type-specifier-style');

const COMMON_TESTS = {
  valid: [
    //
    // prefer-top-level
    //
    test({
      code: "import Foo from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import type Foo from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import { Foo } from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import { Foo as Bar } from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import * as Foo from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import {} from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import type {} from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import type { Foo } from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import type { Foo as Bar } from 'Foo';",
      options: ['prefer-top-level'],
    }),
    test({
      code: "import type { Foo, Bar, Baz, Bam } from 'Foo';",
      options: ['prefer-top-level'],
    }),

    //
    // prefer-inline
    //
    test({
      code: "import Foo from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import type Foo from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import { Foo } from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import { Foo as Bar } from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import * as Foo from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import {} from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import type {} from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import { type Foo } from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import { type Foo as Bar } from 'Foo';",
      options: ['prefer-inline'],
    }),
    test({
      code: "import { type Foo, type Bar, Baz, Bam } from 'Foo';",
      options: ['prefer-inline'],
    }),
  ],
  invalid: [
    //
    // prefer-top-level
    //
    {
      code: "import { type Foo } from 'Foo';",
      output: "import type {Foo} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { type Foo as Bar } from 'Foo';",
      output: "import type {Foo as Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { type Foo, type Bar } from 'Foo';",
      output: "import type {Foo, Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { Foo, type Bar } from 'Foo';",
      output: "import { Foo  } from 'Foo';\nimport type {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import { type Foo, Bar } from 'Foo';",
      output: "import {  Bar } from 'Foo';\nimport type {Foo} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import Foo, { type Bar } from 'Foo';",
      output: "import Foo from 'Foo';\nimport type {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import Foo, { type Bar, Baz } from 'Foo';",
      output: "import Foo, {  Baz } from 'Foo';\nimport type {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
        type: 'ImportSpecifier',
      }],
    },

    //
    // prefer-inline
    //
    {
      code: "import type { Foo } from 'Foo';",
      output: "import  { type Foo } from 'Foo';",
      options: ['prefer-inline'],
      errors: [{
        message: 'Prefer using inline type specifiers instead of a top-level type-only import.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import type { Foo, Bar, Baz } from 'Foo';",
      output: "import  { type Foo, type Bar, type Baz } from 'Foo';",
      options: ['prefer-inline'],
      errors: [{
        message: 'Prefer using inline type specifiers instead of a top-level type-only import.',
        type: 'ImportDeclaration',
      }],
    },
  ],
};

const TS_ONLY = {
  valid: [
    //
    // always valid
    //
    test({ code: "import type * as Foo from 'Foo';" }),
  ],
  invalid: [],
};

const FLOW_ONLY = {
  valid: [
    //
    // prefer-top-level
    //
    {
      code: "import typeof Foo from 'Foo';",
      options: ['prefer-top-level'],
    },
    {
      code: "import typeof { Foo, Bar, Baz, Bam } from 'Foo';",
      options: ['prefer-top-level'],
    },

    //
    // prefer-inline
    //
    {
      code: "import typeof Foo from 'Foo';",
      options: ['prefer-inline'],
    },
    {
      code: "import { typeof Foo } from 'Foo';",
      options: ['prefer-inline'],
    },
    {
      code: "import { typeof Foo, typeof Bar, typeof Baz, typeof Bam } from 'Foo';",
      options: ['prefer-inline'],
    },
    {
      code: "import { type Foo, type Bar, typeof Baz, typeof Bam } from 'Foo';",
      options: ['prefer-inline'],
    },
  ],
  invalid: [
    //
    // prefer-top-level
    //
    {
      code: "import { typeof Foo } from 'Foo';",
      output: "import typeof {Foo} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { typeof Foo as Bar } from 'Foo';",
      output: "import typeof {Foo as Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { type Foo, typeof Bar } from 'Foo';",
      output: "import type {Foo} from 'Foo';\nimport typeof {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level type/typeof-only import instead of inline type/typeof specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { typeof Foo, typeof Bar } from 'Foo';",
      output: "import typeof {Foo, Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import { Foo, typeof Bar } from 'Foo';",
      output: "import { Foo  } from 'Foo';\nimport typeof {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import { typeof Foo, Bar } from 'Foo';",
      output: "import {  Bar } from 'Foo';\nimport typeof {Foo} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import { Foo, type Bar, typeof Baz } from 'Foo';",
      output: "import { Foo   } from 'Foo';\nimport type {Bar} from 'Foo';\nimport typeof {Baz} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [
        {
          message: 'Prefer using a top-level type-only import instead of inline type specifiers.',
          type: 'ImportSpecifier',
        },
        {
          message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
          type: 'ImportSpecifier',
        },
      ],
    },
    {
      code: "import Foo, { typeof Bar } from 'Foo';",
      output: "import Foo from 'Foo';\nimport typeof {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportSpecifier',
      }],
    },
    {
      code: "import Foo, { typeof Bar, Baz } from 'Foo';",
      output: "import Foo, {  Baz } from 'Foo';\nimport typeof {Bar} from 'Foo';",
      options: ['prefer-top-level'],
      errors: [{
        message: 'Prefer using a top-level typeof-only import instead of inline typeof specifiers.',
        type: 'ImportSpecifier',
      }],
    },

    //
    // prefer-inline
    //
    {
      code: "import typeof { Foo } from 'Foo';",
      output: "import  { typeof Foo } from 'Foo';",
      options: ['prefer-inline'],
      errors: [{
        message: 'Prefer using inline typeof specifiers instead of a top-level typeof-only import.',
        type: 'ImportDeclaration',
      }],
    },
    {
      code: "import typeof { Foo, Bar, Baz } from 'Foo';",
      output: "import  { typeof Foo, typeof Bar, typeof Baz } from 'Foo';",
      options: ['prefer-inline'],
      errors: [{
        message: 'Prefer using inline typeof specifiers instead of a top-level typeof-only import.',
        type: 'ImportDeclaration',
      }],
    },
  ],
};

context('TypeScript', () => {
  // inline type specifiers weren't supported prior to TS v4.5
  if (!parsers.TS_NEW || !tsVersionSatisfies('>= 4.5') || !typescriptEslintParserSatisfies('>= 5.7.0')) {
    return;
  }

  const ruleTester = new RuleTester({
    parser: parsers.TS_NEW,
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
    },
  });
  ruleTester.run('consistent-type-specifier-style', rule, {
    valid: [
      ...COMMON_TESTS.valid,
      ...TS_ONLY.valid,
    ],
    invalid: [
      ...COMMON_TESTS.invalid,
      ...TS_ONLY.invalid,
    ],
  });
});

context('Babel/Flow', () => {
  if (!eslintVersionSatisfies('> 3')) {
    return;
  }

  const ruleTester = new RuleTester({
    parser: parsers.BABEL_OLD,
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
    },
  });
  ruleTester.run('consistent-type-specifier-style', rule, {
    valid: [
      ...COMMON_TESTS.valid,
      ...FLOW_ONLY.valid,
    ],
    invalid: [
      ...COMMON_TESTS.invalid,
      ...FLOW_ONLY.invalid,
    ],
  });
});
