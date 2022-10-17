import { test, parsers } from '../utils';

import { RuleTester } from 'eslint';

const ruleTester = new RuleTester();
const rule = require('rules/named-order');

ruleTester.run('named-order', rule, {
  valid: [
    //
    // named import
    //
    test({
      code: `import foo from 'foo'`,
    }),
    test({
      code: `import {} from 'foo'`,
    }),
    test({
      code: `import {a, b} from 'foo'`,
    }),
    test({
      code: `import type {a, b} from 'foo'`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import typeof {a, b} from 'foo'`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {type a, type b} from 'foo'`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {typeof a, typeof b} from 'foo'`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {typeof a, type b} from 'foo'`,
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {A, a, B} from 'foo'`,
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `import {a, A, B} from 'foo'`,
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `import {A, B, a} from 'foo'`,
      options: [{ order: 'uppercaseFirst' }],
    }),
    //
    // named export
    //
    test({
      code: `export {}`,
    }),
    test({
      code: `
        function a() {}
        function b() {}
        export {a, b}
      `,
    }),
    test({
      code: `
        function foo() {}
        function b() {}
        export {foo as a, b}
      `,
    }),
    test({
      code: `
        const A = ''
        const B = ''
        function a() {}
        export {A, a, B}
      `,
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `
        const A = ''
        const B = ''
        function a() {}
        export {a, A, B}
      `,
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `
        const A = ''
        const B = ''
        function a() {}
        export {A, B, a}
      `,
      options: [{ order: 'uppercaseFirst' }],
    }),
    //
    // require
    //
    test({
      code: `const foo = require('foo')`,
    }),
    test({
      code: `const {} = require('foo')`,
    }),
    test({
      code: `const {a, b} = require('foo')`,
    }),
    test({
      code: `const {A, a, B} = require('foo')`,
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `const {a, A, B} = require('foo')`,
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `const {A, B, a} = require('foo')`,
      options: [{ order: 'uppercaseFirst' }],
    }),
  ],
  invalid: [
    //
    // named import
    //
    test({
      code: `import {b, a} from 'foo'`,
      output: `import {a, b} from 'foo'`,
      errors: ['Named import specifiers of `{b, a}` should sort as `{a, b}`'],
    }),
    test({
      code: `import type {b, a} from 'foo'`,
      output: `import type {a, b} from 'foo'`,
      errors: ['Named import specifiers of `{b, a}` should sort as `{a, b}`'],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import typeof {b, a} from 'foo'`,
      output: `import typeof {a, b} from 'foo'`,
      errors: ['Named import specifiers of `{b, a}` should sort as `{a, b}`'],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {type b, type a} from 'foo'`,
      output: `import {type a, type b} from 'foo'`,
      errors: ['Named import specifiers of `{type b, type a}` should sort as `{type a, type b}`'],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {typeof b, typeof a} from 'foo'`,
      output: `import {typeof a, typeof b} from 'foo'`,
      errors: ['Named import specifiers of `{typeof b, typeof a}` should sort as `{typeof a, typeof b}`'],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {typeof b, type a} from 'foo'`,
      output: `import {type a, typeof b} from 'foo'`,
      errors: ['Named import specifiers of `{typeof b, type a}` should sort as `{type a, typeof b}`'],
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: `import {A, B, a} from 'foo'`,
      output: `import {A, a, B} from 'foo'`,
      errors: ['Named import specifiers of `{A, B, a}` should sort as `{A, a, B}`'],
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `import {A, a, B} from 'foo'`,
      output: `import {a, A, B} from 'foo'`,
      errors: ['Named import specifiers of `{A, a, B}` should sort as `{a, A, B}`'],
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `import {A2, A1, a} from 'foo'`,
      output: `import {a, A1, A2} from 'foo'`,
      errors: ['Named import specifiers of `{A2, A1, a}` should sort as `{a, A1, A2}`'],
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `import {A, a, B} from 'foo'`,
      output: `import {A, B, a} from 'foo'`,
      errors: ['Named import specifiers of `{A, a, B}` should sort as `{A, B, a}`'],
      options: [{ order: 'uppercaseFirst' }],
    }),
    //
    // named export
    //
    test({
      code: `
        function a() {}
        function b() {}
        export {b, a}
      `,
      output: `
        function a() {}
        function b() {}
        export {a, b}
      `,
      errors: ['Named export specifiers of `{b, a}` should sort as `{a, b}`'],
    }),
    test({
      code: `
        function foo() {}
        function b() {}
        export {b, foo as a}
      `,
      output: `
        function foo() {}
        function b() {}
        export {foo as a, b}
      `,
      errors: ['Named export specifiers of `{b, foo as a}` should sort as `{foo as a, b}`'],
    }),
    test({
      code: `
        const A = null
        const B = null
        function a() {}
        export {A, B, a}
      `,
      output: `
        const A = null
        const B = null
        function a() {}
        export {A, a, B}
      `,
      errors: ['Named export specifiers of `{A, B, a}` should sort as `{A, a, B}`'],
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `
        const A = null
        const B = null
        function a() {}
        export {A, a, B}
      `,
      output: `
        const A = null
        const B = null
        function a() {}
        export {a, A, B}
      `,
      errors: ['Named export specifiers of `{A, a, B}` should sort as `{a, A, B}`'],
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `
        const A = null
        const B = null
        function a() {}
        export {A, a, B}
      `,
      output: `
        const A = null
        const B = null
        function a() {}
        export {A, B, a}
      `,
      errors: ['Named export specifiers of `{A, a, B}` should sort as `{A, B, a}`'],
      options: [{ order: 'uppercaseFirst' }],
    }),
    //
    // require
    //
    test({
      code: `const {b, a} = require('foo')`,
      output: `const {a, b} = require('foo')`,
      errors: ['Require specifiers of `{b, a}` should sort as `{a, b}`'],
    }),
    test({
      code: `const {A, B, a} = require('foo')`,
      output: `const {A, a, B} = require('foo')`,
      errors: ['Require specifiers of `{A, B, a}` should sort as `{A, a, B}`'],
      options: [{ order: 'caseInsensitive' }],
    }),
    test({
      code: `const {A, a, B} = require('foo')`,
      output: `const {a, A, B} = require('foo')`,
      errors: ['Require specifiers of `{A, a, B}` should sort as `{a, A, B}`'],
      options: [{ order: 'lowercaseFirst' }],
    }),
    test({
      code: `const {A, a, B} = require('foo')`,
      output: `const {A, B, a} = require('foo')`,
      errors: ['Require specifiers of `{A, a, B}` should sort as `{A, B, a}`'],
      options: [{ order: 'uppercaseFirst' }],
    }),
  ],
});
