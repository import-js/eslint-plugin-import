import path from 'path';
import { RuleTester } from 'eslint';

import { test } from '../utils';

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 6, sourceType: 'module' },
});
const rule = require('rules/no-import-module-exports');

const error = {
  message: `Cannot use import declarations in modules that export using CommonJS ` +
    `(module.exports = 'foo' or exports.bar = 'hi')`,
  type: 'ImportDeclaration',
};

ruleTester.run('no-import-module-exports', rule, {
  valid: [
    test({
      code: `
        const thing = require('thing')
        module.exports = thing
      `,
    }),
    test({
      code: `
        import thing from 'otherthing'
        console.log(thing.module.exports)
      `,
    }),
    test({
      code: `
        import thing from 'other-thing'
        export default thing
      `,
    }),
    test({
      code: `
        const thing = require('thing')
        exports.foo = bar
      `,
    }),
    test({
      code: `
        import foo from 'path';
        module.exports = foo;
      `,
      // When the file matches the entry point defined in package.json
      // See tests/files/package.json
      filename: path.join(process.cwd(), 'tests/files/index.js'),
    }),
    test({
      code: `
        import foo from 'path';
        module.exports = foo;
      `,
      filename: path.join(process.cwd(), 'tests/files/some/other/entry-point.js'),
      options: [{ exceptions: ['**/*/other/entry-point.js'] }],
    }),
    test({
      code: `
        import * as process from 'process';
        console.log(process.env);
      `,
      filename: path.join(process.cwd(), 'tests/files/missing-entrypoint/cli.js'),
    }),
  ],
  invalid: [
    test({
      code: `
        import { stuff } from 'starwars'
        module.exports = thing
      `,
      errors: [error],
    }),
    test({
      code: `
        import thing from 'starwars'
        const baz = module.exports = thing
        console.log(baz)
      `,
      errors: [error],
    }),
    test({
      code: `
        import * as allThings from 'starwars'
        exports.bar = thing
      `,
      errors: [error],
    }),
    test({
      code: `
        import thing from 'other-thing'
        exports.foo = bar
      `,
      errors: [error],
    }),
    test({
      code: `
        import foo from 'path';
        module.exports = foo;
      `,
      filename: path.join(process.cwd(), 'tests/files/some/other/entry-point.js'),
      options: [{ exceptions: ['**/*/other/file.js'] }],
      errors: [error],
    }),
  ],
});
