import { SYNTAX_CASES, getTSParsers, parsers } from '../utils';
import { RuleTester, withoutAutofixOutput } from '../rule-tester';
import semver from 'semver';

const rule = require('rules/dynamic-import-chunkname');
const ruleTester = new RuleTester();

const commentFormat = '([0-9a-zA-Z-_/.]|\\[(request|index)\\])+';
const pickyCommentFormat = '[a-zA-Z-_/.]+';
const options = [{ importFunctions: ['dynamicImport'] }];
const pickyCommentOptions = [{
  importFunctions: ['dynamicImport'],
  webpackChunknameFormat: pickyCommentFormat,
}];
const allowEmptyOptions = [{
  importFunctions: ['dynamicImport'],
  allowEmpty: true,
}];
const multipleImportFunctionOptions = [{
  importFunctions: ['dynamicImport', 'definitelyNotStaticImport'],
}];
const parser = parsers.BABEL_OLD;

const noLeadingCommentError = 'dynamic imports require a leading comment with the webpack chunkname';
const nonBlockCommentError = 'dynamic imports require a /* foo */ style comment, not a // foo comment';
const noPaddingCommentError = 'dynamic imports require a block comment padded with spaces - /* foo */';
const invalidSyntaxCommentError = 'dynamic imports require a "webpack" comment with valid syntax';
const commentFormatError = `dynamic imports require a "webpack" comment with valid syntax`;
const chunkNameFormatError = `dynamic imports require a leading comment in the form /*webpackChunkName: ["']${commentFormat}["'],? */`;
const pickyChunkNameFormatError = `dynamic imports require a leading comment in the form /*webpackChunkName: ["']${pickyCommentFormat}["'],? */`;
const eagerModeError = `dynamic imports using eager mode do not need a webpackChunkName`;

ruleTester.run('dynamic-import-chunkname', rule, {
  valid: [
    {
      code: `dynamicImport(
        /* webpackChunkName: "someModule" */
        'test'
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "Some_Other_Module" */
        "test"
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "SomeModule123" */
        "test"
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "someModule" */
        'someModule'
      )`,
      options: pickyCommentOptions,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "[request]" */
        'someModule'
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "my-chunk-[request]-custom" */
        'someModule'
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: '[index]' */
        'someModule'
      )`,
      options,
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: 'my-chunk.[index].with-index' */
        'someModule'
      )`,
      options,
    },
    {
      code: `import('test')`,
      options: allowEmptyOptions,
      parser,
    },
    {
      code: `import(
        /* webpackMode: "lazy" */
        'test'
      )`,
      options: allowEmptyOptions,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "Some_Other_Module" */
        "test"
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "SomeModule123" */
        "test"
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackPrefetch: true */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackPrefetch: true, */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackPrefetch: true, webpackChunkName: "someModule" */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackPrefetch: true, webpackChunkName: "someModule", */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackPrefetch: true */
        /* webpackChunkName: "someModule" */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPrefetch: true */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPrefetch: 12 */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPrefetch: -30 */
        'test'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule' */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "[request]" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "my-chunk-[request]-custom" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: '[index]' */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: 'my-chunk.[index].with-index' */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackInclude: /\\.json$/ */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackInclude: /\\.json$/ */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackExclude: /\\.json$/ */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackExclude: /\\.json$/ */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPreload: true */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPreload: 0 */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackPreload: -2 */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackPreload: false */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackIgnore: false */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackIgnore: true */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackMode: "lazy" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule', webpackMode: 'lazy' */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackMode: "lazy-once" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackMode: "eager" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackMode: "weak" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackExports: "default" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule", webpackExports: "named" */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackExports: ["default", "named"] */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule', webpackExports: ['default', 'named'] */
        'someModule'
      )`,
      options,
      parser,
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackInclude: /\\.json$/ */
        /* webpackExclude: /\\.json$/ */
        /* webpackPrefetch: true */
        /* webpackPreload: true */
        /* webpackIgnore: false */
        /* webpackMode: "lazy" */
        /* webpackExports: ["default", "named"] */
        'someModule'
      )`,
      options,
      parser,
    },
    ...SYNTAX_CASES,
  ],

  invalid: [
    withoutAutofixOutput({
      code: `import(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: 'import(\'test\')',
      options,
      parser,
      errors: [{
        message: noLeadingCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: "someModule' */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: 'someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: true */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: chunkNameFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: "my-module-[id]" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: chunkNameFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: ["request"] */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: chunkNameFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /*webpackChunkName: "someModule"*/
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: noPaddingCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName  :  "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: "someModule" ; */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* totally not webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackPrefetch: true */
        /* webpackChunk: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackPrefetch: true, webpackChunk: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      parser,
      errors: [{
        message: pickyChunkNameFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackPrefetch: "module", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackPreload: "module", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackIgnore: "no", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackInclude: "someModule", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackInclude: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackExclude: "someModule", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackExclude: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackMode: "fast", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackMode: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackExports: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackExports: /default/, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `definitelyNotStaticImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      options,
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: 'dynamicImport(\'test\')',
      options,
      errors: [{
        message: noLeadingCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      options,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
      options,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `dynamicImport(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      errors: [{
        message: pickyChunkNameFormatError,
        type: 'CallExpression',
      }],
    }),
    withoutAutofixOutput({
      code: `import(
        /* webpackChunkName: "someModule" */
        /* webpackMode: "eager" */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: eagerModeError,
        type: 'CallExpression',
        suggestions: [
          {
            desc: 'Remove webpackChunkName',
            output: `import(
        ${''}
        /* webpackMode: "eager" */
        'someModule'
      )`,
          },
          {
            desc: 'Remove webpackMode',
            output: `import(
        /* webpackChunkName: "someModule" */
        ${''}
        'someModule'
      )`,
          },
        ],
      }],
    }),
  ],
});

context('TypeScript', () => {
  getTSParsers().forEach((typescriptParser) => {
    const nodeType = typescriptParser === parsers.TS_OLD || typescriptParser === parsers.TS_NEW && semver.satisfies(require('@typescript-eslint/parser/package.json').version, '^2')
      ? 'CallExpression'
      : 'ImportExpression';

    ruleTester.run('dynamic-import-chunkname', rule, {
      valid: [
        {
          code: `import('test')`,
          options: allowEmptyOptions,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackMode: "lazy" */
            'test'
          )`,
          options: allowEmptyOptions,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "Some_Other_Module" */
            "test"
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "SomeModule123" */
            "test"
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackPrefetch: true */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackPrefetch: true, */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackPrefetch: true, webpackChunkName: "someModule" */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackPrefetch: true, webpackChunkName: "someModule", */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackPrefetch: true */
            /* webpackChunkName: "someModule" */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackPrefetch: true */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackPrefetch: 11 */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackPrefetch: -11 */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            'someModule'
          )`,
          options: pickyCommentOptions,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: 'someModule' */
            'test'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "[request]" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "my-chunk-[request]-custom" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: '[index]' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: 'my-chunk.[index].with-index' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackInclude: /\\.json$/ */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackInclude: /\\.json$/ */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackExclude: /\\.json$/ */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackExclude: /\\.json$/ */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackPreload: true */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackPreload: false */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackIgnore: false */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackIgnore: true */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: 'someModule', webpackMode: 'lazy' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackMode: "lazy-once" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackMode: "lazy" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackMode: "weak" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackExports: "default" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule", webpackExports: "named" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackExports: ["default", "named"] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: 'someModule', webpackExports: ['default', 'named'] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" */
            /* webpackInclude: /\\.json$/ */
            /* webpackExclude: /\\.json$/ */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackIgnore: false */
            /* webpackMode: "lazy" */
            /* webpackExports: ["default", "named"] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
        {
          code: `import(
            /* webpackMode: "eager" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
      ],
      invalid: [
        withoutAutofixOutput({
          code: `import(
            // webpackChunkName: "someModule"
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: nonBlockCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: 'import(\'test\')',
          options,
          parser: typescriptParser,
          errors: [{
            message: noLeadingCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: someModule */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName "someModule' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName 'someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName:"someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /*webpackChunkName: "someModule"*/
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: noPaddingCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName  :  "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: "someModule" ; */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* totally not webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackPrefetch: true */
            /* webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackPrefetch: true, webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: true */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: chunkNameFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: "my-module-[id]" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: chunkNameFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: ["request"] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: chunkNameFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: "someModule123" */
            'someModule'
          )`,
          options: pickyCommentOptions,
          parser: typescriptParser,
          errors: [{
            message: pickyChunkNameFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackPrefetch: "module", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackPreload: "module", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackIgnore: "no", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackInclude: "someModule", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackInclude: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackExclude: "someModule", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackExclude: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackMode: "fast", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackMode: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackExports: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackExports: /default/, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        }),
        withoutAutofixOutput({
          code: `import(
            /* webpackChunkName: "someModule", webpackMode: "eager" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          errors: [{
            message: eagerModeError,
            type: nodeType,
            suggestions: [
              {
                desc: 'Remove webpackChunkName',
                output: `import(
            /* webpackMode: "eager" */
            'someModule'
          )`,
              },
              {
                desc: 'Remove webpackMode',
                output: `import(
            /* webpackChunkName: "someModule" */
            'someModule'
          )`,
              },
            ],
          }],
        }),
        withoutAutofixOutput({
          code: `
            import(
              /* webpackMode: "eager", webpackChunkName: "someModule" */
              'someModule'
            )
          `,
          options,
          parser: typescriptParser,
          errors: [{
            message: eagerModeError,
            type: nodeType,
            suggestions: [
              {
                desc: 'Remove webpackChunkName',
                output: `
            import(
              /* webpackMode: "eager" */
              'someModule'
            )
          `,
              },
              {
                desc: 'Remove webpackMode',
                output: `
            import(
              /* webpackChunkName: "someModule" */
              'someModule'
            )
          `,
              },
            ],
          }],
        }),
        withoutAutofixOutput({
          code: `
            import(
              /* webpackMode: "eager", webpackPrefetch: true, webpackChunkName: "someModule" */
              'someModule'
            )
          `,
          options,
          parser: typescriptParser,
          errors: [{
            message: eagerModeError,
            type: nodeType,
            suggestions: [
              {
                desc: 'Remove webpackChunkName',
                output: `
            import(
              /* webpackMode: "eager", webpackPrefetch: true */
              'someModule'
            )
          `,
              },
              {
                desc: 'Remove webpackMode',
                output: `
            import(
              /* webpackPrefetch: true, webpackChunkName: "someModule" */
              'someModule'
            )
          `,
              },
            ],
          }],
        }),
        withoutAutofixOutput({
          code: `
            import(
              /* webpackChunkName: "someModule" */
              /* webpackMode: "eager" */
              'someModule'
            )
          `,
          options,
          parser: typescriptParser,
          errors: [{
            message: eagerModeError,
            type: nodeType,
            suggestions: [
              {
                desc: 'Remove webpackChunkName',
                output: `
            import(
              ${''}
              /* webpackMode: "eager" */
              'someModule'
            )
          `,
              },
              {
                desc: 'Remove webpackMode',
                output: `
            import(
              /* webpackChunkName: "someModule" */
              ${''}
              'someModule'
            )
          `,
              },
            ],
          }],
        }),
      ],
    });
  });
});
