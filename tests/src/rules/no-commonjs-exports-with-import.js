import { RuleTester } from 'eslint'

const ruleTester = new RuleTester()
const rule = require('rules/no-commonjs-exports-with-import')

const parserOptions = {
  ecmaVersion: 6,
  sourceType: 'module',
}

ruleTester.run('no-commonjs-exports-with-import', rule, {
  valid: [
    {
      code: `
        import foo from './foo';
        export default foo;
      `,
      parserOptions,
    },

    {
      code: `
        const foo = require('./foo');
        export default foo;
      `,
      parserOptions,
    },

    {
      code: `
        const foo = require('./foo');
        module.exports = foo;
      `,
      parserOptions,
    },

    {
      code: `
        const foo = require('./foo');
        exports.foo = foo;
      `,
      parserOptions,
    },

    {
      code: `
        const foo = require('./foo');
        exports.use(foo);
      `,
      parserOptions,
    },
  ],

  invalid: [
    {
      code: `
        import foo from './foo';
        module.exports = foo;
      `,
      errors: [{
        message: 'Cannot use CommonJS exports in the same file as `import`',
        type: 'AssignmentExpression',
      }],
      parserOptions,
    },

    {
      code: `
        import foo from './foo';
        exports = foo;
      `,
      errors: [{
        message: 'Cannot use CommonJS exports in the same file as `import`',
        type: 'AssignmentExpression',
      }],
      parserOptions,
    },

    {
      code: `
        import foo from './foo';
        exports.use(foo);
      `,
      errors: [{
        message: 'Cannot use CommonJS exports in the same file as `import`',
        type: 'CallExpression',
      }],
      parserOptions,
    },

    {
      code: `
        module.exports = {};
        import foo from './foo';
      `,
      errors: [{
        message: 'Cannot use CommonJS exports in the same file as `import`',
        type: 'ImportDeclaration',
      }],
      parserOptions,
    },
  ],
})
