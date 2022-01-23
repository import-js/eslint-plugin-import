import { SYNTAX_CASES, getTSParsers, parsers } from '../utils';
import { RuleTester } from 'eslint';
import semver from 'semver';

const rule = require('rules/dynamic-import-chunkname');
const ruleTester = new RuleTester();

const commentFormat = '[0-9a-zA-Z-_/.]+';
const pickyCommentFormat = '[a-zA-Z-_/.]+';
const options = [{ importFunctions: ['dynamicImport'] }];
const pickyCommentOptions = [{
  importFunctions: ['dynamicImport'],
  webpackChunknameFormat: pickyCommentFormat,
}];
const multipleImportFunctionOptions = [{
  importFunctions: ['dynamicImport', 'definitelyNotStaticImport'],
}];
const parser = parsers.BABEL_OLD;

const noLeadingCommentError = 'dynamic imports require a leading comment with the webpack chunkname';
const nonBlockCommentError = 'dynamic imports require a /* foo */ style comment, not a // foo comment';
const noPaddingCommentError = 'dynamic imports require a block comment padded with spaces - /* foo */';
const invalidSyntaxCommentError = 'dynamic imports require a "webpack" comment with valid syntax';
const commentFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: ["']${commentFormat}["'],? */`;
const pickyCommentFormatError = `dynamic imports require a leading comment in the form /* webpackChunkName: ["']${pickyCommentFormat}["'],? */`;

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
      output: `import(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: 'import(\'test\')',
      options,
      parser,
      output: 'import(\'test\')',
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
      output: `import(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `import(
        /* webpackChunkName: "someModule' */
        'someModule'
      )`,
      options,
      parser,
      output: `import(
        /* webpackChunkName: "someModule' */
        'someModule'
      )`,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `import(
        /* webpackChunkName: 'someModule" */
        'someModule'
      )`,
      options,
      parser,
      output: `import(
        /* webpackChunkName: 'someModule" */
        'someModule'
      )`,
      errors: [{
        message: invalidSyntaxCommentError,
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
      output: `import(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
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
      output: `import(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
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
      output: `import(
        /*webpackChunkName: "someModule"*/
        'someModule'
      )`,
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
      output: `import(
        /* webpackChunkName  :  "someModule" */
        'someModule'
      )`,
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
      output: `import(
        /* webpackChunkName: "someModule" ; */
        'someModule'
      )`,
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
      output: `import(
        /* totally not webpackChunkName: "someModule" */
        'someModule'
      )`,
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
      output: `import(
        /* webpackPrefetch: true */
        /* webpackChunk: "someModule" */
        'someModule'
      )`,
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
      output: `import(
        /* webpackPrefetch: true, webpackChunk: "someModule" */
        'someModule'
      )`,
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
      output: `import(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
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
      output: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
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
      output: `definitelyNotStaticImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
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
      output: `dynamicImport(
        // webpackChunkName: "someModule"
        'someModule'
      )`,
      errors: [{
        message: nonBlockCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: 'dynamicImport(\'test\')',
      options,
      output: 'dynamicImport(\'test\')',
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
      output: `dynamicImport(
        /* webpackChunkName: someModule */
        'someModule'
      )`,
      errors: [{
        message: invalidSyntaxCommentError,
        type: 'CallExpression',
      }],
    },
    {
      code: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
      options,
      output: `dynamicImport(
        /* webpackChunkName "someModule" */
        'someModule'
      )`,
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
      output: `dynamicImport(
        /* webpackChunkName:"someModule" */
        'someModule'
      )`,
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
      output: `dynamicImport(
        /* webpackChunkName: "someModule123" */
        'someModule'
      )`,
      errors: [{
        message: pickyCommentFormatError,
        type: 'CallExpression',
      }],
    },
  ],
});

context('TypeScript', () => {
  getTSParsers().forEach((typescriptParser) => {
    const nodeType = typescriptParser === parsers.TS_OLD || (typescriptParser === parsers.TS_NEW && semver.satisfies(require('@typescript-eslint/parser/package.json').version, '^2'))
      ? 'CallExpression'
      : 'ImportExpression';

    ruleTester.run('dynamic-import-chunkname', rule, {
      valid: [
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
            'someModule'
          )`,
          options: pickyCommentOptions,
          parser: typescriptParser,
          errors: [{
            message: pickyCommentFormatError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName: 'someModule' */
            'test'
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
          output: `import(
            // webpackChunkName: "someModule"
            'someModule'
          )`,
          errors: [{
            message: nonBlockCommentError,
            type: nodeType,
          }],
        },
        {
          code: 'import(\'test\')',
          options,
          parser: typescriptParser,
          output: 'import(\'test\')',
          errors: [{
            message: noLeadingCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName: someModule */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName: someModule */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName "someModule' */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName "someModule' */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName 'someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName 'someModule" */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName "someModule" */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName:"someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName:"someModule" */
            'someModule'
          )`,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /*webpackChunkName: "someModule"*/
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /*webpackChunkName: "someModule"*/
            'someModule'
          )`,
          errors: [{
            message: noPaddingCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName  :  "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName  :  "someModule" */
            'someModule'
          )`,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName: "someModule" ; */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName: "someModule" ; */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* totally not webpackChunkName: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* totally not webpackChunkName: "someModule" */
            'someModule'
          )`,
          errors: [{
            message: invalidSyntaxCommentError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackPrefetch: true */
            /* webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackPrefetch: true */
            /* webpackChunk: "someModule" */
            'someModule'
          )`,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackPrefetch: true, webpackChunk: "someModule" */
            'someModule'
          )`,
          options,
          parser: typescriptParser,
          output: `import(
            /* webpackPrefetch: true, webpackChunk: "someModule" */
            'someModule'
          )`,
          errors: [{
            message: commentFormatError,
            type: nodeType,
          }],
        },
        {
          code: `import(
            /* webpackChunkName: "someModule123" */
            'someModule'
          )`,
          options: pickyCommentOptions,
          parser: typescriptParser,
          output: `import(
            /* webpackChunkName: "someModule123" */
            'someModule'
          )`,
          errors: [{
            message: pickyCommentFormatError,
            type: nodeType,
          }],
        },
      ],
    });
  });
});
