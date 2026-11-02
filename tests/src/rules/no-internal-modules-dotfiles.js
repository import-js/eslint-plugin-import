import { RuleTester } from '../rule-tester';
import rule from 'rules/no-internal-modules';
import { test, testFilePath } from '../utils';

const filename = testFilePath('./internal-modules/plugins/plugin2/internal.js');
const ruleTester = new RuleTester();

ruleTester.run('no-internal-modules dotfile boundaries', rule, {
  valid: [
    ['a/**', 'a/b/.hidden'],
    ['a/**/entry', 'a/b/.hidden/entry'],
    ['!**/.hidden', 'a/.hidden'],
    ['a/**', 'a/line\nbreak'],
    ['a/**', 'a/line\rbreak'],
    ['a/*', 'a/\nentry'],
    ['!a/**', 'b/line\nbreak'],
  ].map(([pattern, moduleName]) => test({
    code: `import value from ${JSON.stringify(moduleName)};`,
    filename,
    options: [{ forbid: [pattern] }],
  })),
  invalid: [
    ['a/**', 'a/.hidden'],
    ['a/**/entry', 'a/.hidden/entry'],
    ['a/**/**', 'a/b/.hidden'],
    ['a/{b,c}/**', 'a/b/.hidden'],
    ['a/*', 'a/line\nbreak'],
  ].map(([pattern, moduleName]) => test({
    code: `import value from ${JSON.stringify(moduleName)};`,
    filename,
    options: [{ forbid: [pattern] }],
    errors: [{ message: `Reaching to "${moduleName}" is not allowed.` }],
  })),
});
