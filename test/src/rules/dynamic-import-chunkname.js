import { SYNTAX_CASES, getTSParsers, parsers } from '../utils'
import { RuleTester } from 'eslint'
import semver from 'semver'

const rule = require('rules/dynamic-import-chunkname')
const ruleTester = new RuleTester()

const commentFormat = '([0-9a-zA-Z-_/.]|\\[(request|index)\\])+'
const pickyCommentFormat = '[a-zA-Z-_/.]+'
const options = [{ importFunctions: ['dynamicImport'] }]
const pickyCommentOptions = [
  {
    importFunctions: ['dynamicImport'],
    webpackChunknameFormat: pickyCommentFormat,
  },
]
const allowEmptyOptions = [
  {
    importFunctions: ['dynamicImport'],
    allowEmpty: true,
  },
]
const multipleImportFunctionOptions = [
  {
    importFunctions: ['dynamicImport', 'definitelyNotStaticImport'],
  },
]
const parser = parsers.BABEL_OLD

const noLeadingCommentError =
  'dynamic imports require a leading comment with the webpack chunkname'
const nonBlockCommentError =
  'dynamic imports require a /* foo */ style comment, not a // foo comment'
const noPaddingCommentError =
  'dynamic imports require a block comment padded with spaces - /* foo */'
const invalidSyntaxCommentError =
  'dynamic imports require a "webpack" comment with valid syntax'
const commentFormatError = `dynamic imports require a "webpack" comment with valid syntax`
const chunkNameFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: ["']${commentFormat}["'],? */`
const pickyChunkNameFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: ["']${pickyCommentFormat}["'],? */`

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
        /* webpackChunkName: "someModule" */
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
        /* webpackMode: "eager" */
        /* webpackExports: ["default", "named"] */
        'someModule'
      )`,
      options,
      parser,
    },
    ...SYNTAX_CASES,
  ],

  invalid: [
    {
      code: `import(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: nonBlockCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "import('test')",
      options,
      parser,
      output: null,
      errors: [
        {
          message: noLeadingCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: "someModule' */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: true */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: chunkNameFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: "my-module-[id]" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: chunkNameFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: ["request"] */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: chunkNameFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /*webpackChunkName: "someModule"*/
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: noPaddingCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName  :  "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: "someModule" ; */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* totally not webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackPrefetch: true */
        /* webpackChunk: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackPrefetch: true, webpackChunk: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      parser,
      output: null,
      errors: [
        {
          message: pickyChunkNameFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackPrefetch: "module", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackPreload: "module", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackIgnore: "no", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackInclude: "someModule", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackInclude: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackExclude: "someModule", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackExclude: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackMode: "fast", webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackMode: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackExports: true, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `import(
        /* webpackExports: /default/, webpackChunkName: "someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `definitelyNotStaticImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      options,
      output: null,
      errors: [
        {
          message: nonBlockCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "dynamicImport('test')",
      options,
      output: null,
      errors: [
        {
          message: noLeadingCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      options,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      output: null,
      errors: [
        {
          message: invalidSyntaxCommentError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
      options,
      output: null,
      errors: [
        {
          message: commentFormatError,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      output: null,
      errors: [
        {
          message: pickyChunkNameFormatError,
          type: 'CallExpression',
        },
      ],
    },
  ],
})

describe('TypeScript', () => {
  getTSParsers().forEach(typescriptParser => {
    const nodeType =
      typescriptParser === parsers.TS_OLD ||
      (typescriptParser === parsers.TS_NEW &&
        semver.satisfies(
          require('@typescript-eslint/parser/package.json').version,
          '^2',
        ))
        ? 'CallExpression'
        : 'ImportExpression'

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
            /* webpackChunkName: "someModule" */
            /* webpackMode: "lazy" */
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
            /* webpackMode: "eager" */
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
            /* webpackMode: "eager" */
            /* webpackExports: ["default", "named"] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
        },
      ],
      invalid: [
        {
          code: `import(
            // webpackChunkName: "someModule"
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: nonBlockCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: "import('test')",
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: noLeadingCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: someModule */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName "someModule' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName 'someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName:"someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /*webpackChunkName: "someModule"*/
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: noPaddingCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName  :  "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" ; */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* totally not webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: invalidSyntaxCommentError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackPrefetch: true */
            /* webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackPrefetch: true, webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: true */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: chunkNameFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: "my-module-[id]" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: chunkNameFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: ["request"] */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: chunkNameFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackChunkName: "someModule123" */
            'someModule'
          )`,
          options: pickyCommentOptions,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: pickyChunkNameFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackPrefetch: "module", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackPreload: "module", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackIgnore: "no", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackInclude: "someModule", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackInclude: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackExclude: "someModule", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackExclude: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackMode: "fast", webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackMode: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackExports: true, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
        {
          code: `import(
            /* webpackExports: /default/, webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: null,
          errors: [
            {
              message: commentFormatError,
              type: nodeType,
            },
          ],
        },
      ],
    })
  })
})
