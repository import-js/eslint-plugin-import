import { test, testVersion, SYNTAX_CASES, parsers } from '../utils';
import { RuleTester } from '../rule-tester';

const ruleTester = new RuleTester();
const rule = require('rules/no-named-as-default');

ruleTester.run('no-named-as-default', rule, {
  valid: [].concat(
    test({ code: 'import "./malformed.js"' }),

    test({ code: 'import bar, { foo } from "./bar";' }),
    test({ code: 'import bar, { foo } from "./empty-folder";' }),

    // es7
    test({
      code: 'export bar, { foo } from "./bar";',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export bar from "./bar";',
      parser: parsers.BABEL_OLD,
    }),

    // #566: don't false-positive on `default` itself
    test({
      code: 'export default from "./bar";',
      parser: parsers.BABEL_OLD,
    }),

    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'import bar, { foo } from "./export-default-string-and-named"',
      parserOptions: { ecmaVersion: 2022 },
    })),

    // #1594: Allow importing as default if object is exported both as default and named
    test({ code: 'import something from "./no-named-as-default/re-exports.js";' }),
    test({
      code: 'import { something } from "./no-named-as-default/re-exports.js";',
    }),
    test({
      code: 'import myOwnNameForVariable from "./no-named-as-default/exports.js";',
    }),
    test({
      code: 'import { variable } from "./no-named-as-default/exports.js";',
    }),
    test({
      code: 'import variable from "./no-named-as-default/misleading-re-exports.js";',
    }),
    test({
      // incorrect import
      code: 'import foobar from "./no-named-as-default/no-default-export.js";',
    }),
    // same tests, but for exports
    test({
      code: 'export something from "./no-named-as-default/re-exports.js";',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export { something } from "./no-named-as-default/re-exports.js";',
    }),
    test({
      code: 'export myOwnNameForVariable from "./no-named-as-default/exports.js";',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export { variable } from "./no-named-as-default/exports.js";',
    }),
    test({
      code: 'export variable from "./no-named-as-default/misleading-re-exports.js";',
      parser: parsers.BABEL_OLD,
    }),
    test({
      code: 'export foobar from "./no-named-as-default/no-default-export.js";',
      parser: parsers.BABEL_OLD,
    }),

    ...SYNTAX_CASES,
  ),

  invalid: [].concat(
    test({
      code: 'import foo from "./bar";',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'import foo, { foo as bar } from "./bar";',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
    }),

    // es7
    test({
      code: 'export foo from "./bar";',
      parser: parsers.BABEL_OLD,
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ExportDefaultSpecifier',
      }],
    }),
    test({
      code: 'export foo, { foo as bar } from "./bar";',
      parser: parsers.BABEL_OLD,
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default export.',
        type: 'ExportDefaultSpecifier',
      }],
    }),

    test({
      code: 'import foo from "./malformed.js"',
      errors: [{
        message: "Parse errors in imported module './malformed.js': 'return' outside of function (1:1)",
        type: 'Literal',
      }],
    }),

    // es2022: Arbitrary module namespae identifier names
    testVersion('>= 8.7', () => ({
      code: 'import foo from "./export-default-string-and-named"',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
      parserOptions: { ecmaVersion: 2022 },
    })),
    testVersion('>= 8.7', () => ({
      code: 'import foo, { foo as bar } from "./export-default-string-and-named"',
      errors: [{
        message: 'Using exported name \'foo\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
      parserOptions: { ecmaVersion: 2022 },
    })),

    // #1594: Allow importing as default if object is exported both as default and named
    test({
      code: 'import something from "./no-named-as-default/misleading-re-exports.js";',
      parser: parsers.BABEL_OLD,
      errors: [{
        message: 'Using exported name \'something\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    // The only cases that are not covered by the fix
    test({
      code: 'import variable from "./no-named-as-default/exports.js";',
      errors: [{
        message: 'Using exported name \'variable\' as identifier for default import.',
        type: 'ImportDefaultSpecifier',
      }],
    }),
    test({
      code: 'export variable from "./no-named-as-default/exports.js";',
      parser: parsers.BABEL_OLD,
      errors: [{
        message: 'Using exported name \'variable\' as identifier for default export.',
        type: 'ExportDefaultSpecifier',
      }],
    }),
  ),
});
