import { SYNTAX_CASES } from '../utils'
import { RuleTester } from 'eslint'

const rule = require('rules/dynamic-import-chunkname')
const ruleTester = new RuleTester()

const commentFormat = '[0-9a-zA-Z-_/.]+'
const pickyCommentFormat = '[a-zA-Z-_/.]+'
const options = [{ importFunctions: ['dynamicImport'] }]
const pickyCommentOptions = [{
  importFunctions: ['dynamicImport'],
  webpackChunknameFormat: pickyCommentFormat,
}]
const multipleImportFunctionOptions = [{
  importFunctions: ['dynamicImport', 'definitelyNotStaticImport'],
}]
const parser = 'babel-eslint'

const noLeadingCommentError = 'dynamic imports require a leading comment with the webpack chunkname'
const nonBlockCommentError = 'dynamic imports require a /* foo */ style comment, not a // foo comment'
const noPaddingCommentError = 'dynamic imports require a block comment padded with spaces - /* foo */'
const invalidSyntaxCommentError = 'dynamic imports require a "webpack" comment with valid syntax'
const commentFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: "${commentFormat}",? */`
const pickyCommentFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: "${pickyCommentFormat}",? */`

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
      errors: [{
        message: pickyCommentFormatError,
        type: 'CallExpression',
      }],
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
        'someModule'
      )`,
      options: pickyCommentOptions,
      parser,
      errors: [{
        message: pickyCommentFormatError,
        type: 'CallExpression',
      }],
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
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: 'import(\'test\')',
      options,
      parser,
      errors: [{
        message: noLeadingCommentError,
        type: 'CallExpression',
      }],
    },
    {
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
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule' */
        'someModule'
      )`,
      options,
      parser,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
      code: `import(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      parser,
      errors: [{
        message: pickyCommentFormatError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `definitelyNotStaticImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options: multipleImportFunctionOptions,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      options,
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: 'dynamicImport(\'test\')',
      options,
      errors: [{
        message: noLeadingCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      options,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: 'someModule' */
        'someModule'
      )`,
      options,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
      options,
      errors: [{
        message: commentFormatError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      options: pickyCommentOptions,
      errors: [{
        message: pickyCommentFormatError,
        type: 'CallExpression',
      }],
    },
  ],
})
