import { RuleTester, withoutAutofixOutput } from '../rule-tester';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import { test } from '../utils';

const ERROR_MESSAGE = 'Unexpected namespace import.';

const ruleTester = new RuleTester();

// --fix functionality requires ESLint 5+
const FIX_TESTS = semver.satisfies(eslintPkg.version, '>5.0.0') ? [
  test({
    code: `
      import * as foo from './foo';
      florp(foo.bar);
      florp(foo['baz']);
    `.trim(),
    output: `
      import { bar, baz } from './foo';
      florp(bar);
      florp(baz);
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  }),
  test({
    code: `
      import * as foo from './foo';
      const bar = 'name conflict';
      const baz = 'name conflict';
      const foo_baz = 'name conflict';
      florp(foo.bar);
      florp(foo['baz']);
    `.trim(),
    output: `
      import { bar as foo_bar, baz as foo_baz_1 } from './foo';
      const bar = 'name conflict';
      const baz = 'name conflict';
      const foo_baz = 'name conflict';
      florp(foo_bar);
      florp(foo_baz_1);
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  }),
  test({
    code: `
      import * as foo from './foo';
      function func(arg) {
        florp(foo.func);
        florp(foo['arg']);
      }
    `.trim(),
    output: `
      import { func as foo_func, arg as foo_arg } from './foo';
      function func(arg) {
        florp(foo_func);
        florp(foo_arg);
      }
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  }),
  test({
    code: `
      import * as ns from './foo';
      florp(ns.default, ns.a);
      florp(ns.enum, ns['class'], ns.eval);
    `.trim(),
    output: `
      import { default as ns_default, a, enum as ns_enum, class as ns_class, eval as ns_eval } from './foo';
      florp(ns_default, a);
      florp(ns_enum, ns_class, ns_eval);
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  }),
  test({
    code: `
      import * as ns from './foo';
      const ns_default = 'name conflict';
      florp(ns.default);
    `.trim(),
    output: `
      import { default as ns_default_1 } from './foo';
      const ns_default = 'name conflict';
      florp(ns_default_1);
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  }),
  // a key that is not an identifier has no named import equivalent, so there is no fix
  test(withoutAutofixOutput({
    code: `
      import * as ns from './foo';
      florp(ns['my-key'], ns.a);
    `.trim(),
    errors: [{
      line: 1,
      column: 8,
      message: ERROR_MESSAGE,
    }],
  })),
] : [];

ruleTester.run('no-namespace', require('rules/no-namespace'), {
  valid: [
    { code: 'import { a, b } from \'foo\';', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import { a, b } from \'./foo\';', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import bar from \'bar\';', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import bar from \'./bar\';', parserOptions: { ecmaVersion: 2015, sourceType: 'module' } },
    { code: 'import * as bar from \'./ignored-module.ext\';', parserOptions: { ecmaVersion: 2015, sourceType: 'module' }, options: [{ ignore: ['*.ext'] }] },
  ],

  invalid: [
    test(withoutAutofixOutput({
      code: 'import * as foo from \'foo\';',
      errors: [{
        line: 1,
        column: 8,
        message: ERROR_MESSAGE,
      }],
    })),
    test(withoutAutofixOutput({
      code: 'import defaultExport, * as foo from \'foo\';',
      errors: [{
        line: 1,
        column: 23,
        message: ERROR_MESSAGE,
      }],
    })),
    test(withoutAutofixOutput({
      code: 'import * as foo from \'./foo\';',
      errors: [{
        line: 1,
        column: 8,
        message: ERROR_MESSAGE,
      }],
    })),
    ...FIX_TESTS,
  ],
});
