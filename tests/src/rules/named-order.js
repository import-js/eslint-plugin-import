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
      code: `import {b, a} from 'foo'`,
      options: [{ order: 'desc' }],
    }),
    test({
      code: `import {A, a} from 'foo'`,
      options: [{ caseInsensitive: true }],
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
        function a() {}
        export {a, A}
      `,
      options: [{ caseInsensitive: true }],
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
      code: `import {a, b} from 'foo'`,
      output: `import {b, a} from 'foo'`,
      errors: ['Named import specifiers of `{a, b}` should sort as `{b, a}`'],
      options: [{ order: 'desc' }],
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
        const A = ''
        function a() {}
        export {a, A}
      `,
      output: `
        const A = ''
        function a() {}
        export {A, a}
      `,
      errors: ['Named export specifiers of `{a, A}` should sort as `{A, a}`'],
    }),
  ],
});
