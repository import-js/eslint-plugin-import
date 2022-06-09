import path from 'path';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';
import typescriptPkg from 'typescript/package.json';

// warms up the module cache. this import takes a while (>500ms)
import 'babel-eslint';

export const parsers = {
  ESPREE: require.resolve('espree'),
  TS_OLD: semver.satisfies(eslintPkg.version, '>=4.0.0 <6.0.0') && semver.satisfies(typescriptPkg.version, '<4') && require.resolve('typescript-eslint-parser'),
  TS_NEW: semver.satisfies(eslintPkg.version, '> 5') && require.resolve('@typescript-eslint/parser'),
  BABEL_OLD: require.resolve('babel-eslint'),
};

export function tsVersionSatisfies(specifier) {
  return semver.satisfies(typescriptPkg.version, specifier);
}

export function typescriptEslintParserSatisfies(specifier) {
  return parsers.TS_NEW && semver.satisfies(require('@typescript-eslint/parser/package.json').version, specifier);
}

export function testFilePath(relativePath) {
  return path.join(process.cwd(), './tests/files', relativePath);
}

export function getTSParsers() {
  return [
    parsers.TS_OLD,
    parsers.TS_NEW,
  ].filter(Boolean);
}

export function getNonDefaultParsers() {
  return getTSParsers().concat(parsers.BABEL_OLD).filter(Boolean);
}

export const FILENAME = testFilePath('foo.js');

export function eslintVersionSatisfies(specifier) {
  return semver.satisfies(eslintPkg.version, specifier);
}

export function testVersion(specifier, t) {
  return eslintVersionSatisfies(specifier) ? test(t()) : [];
}

export function test(t) {
  if (arguments.length !== 1) {
    throw new SyntaxError('`test` requires exactly one object argument');
  }
  return Object.assign({
    filename: FILENAME,
  }, t, {
    parserOptions: Object.assign({
      sourceType: 'module',
      ecmaVersion: 9,
    }, t.parserOptions),
  });
}

export function testContext(settings) {
  return { getFilename() { return FILENAME; },
    settings: settings || {} };
}

export function getFilename(file) {
  return path.join(__dirname, '..', 'files', file || 'foo.js');
}

/**
 * to be added as valid cases just to ensure no nullable fields are going
 * to crash at runtime
 * @type {Array}
 */
export const SYNTAX_CASES = [

  test({ code: 'for (let { foo, bar } of baz) {}' }),
  test({ code: 'for (let [ foo, bar ] of baz) {}' }),

  test({ code: 'const { x, y } = bar' }),
  test({ code: 'const { x, y, ...z } = bar', parser: parsers.BABEL_OLD }),

  // all the exports
  test({ code: 'let x; export { x }' }),
  test({ code: 'let x; export { x as y }' }),

  // not sure about these since they reference a file
  // test({ code: 'export { x } from "./y.js"'}),
  // test({ code: 'export * as y from "./y.js"', parser: parsers.BABEL_OLD}),

  test({ code: 'export const x = null' }),
  test({ code: 'export var x = null' }),
  test({ code: 'export let x = null' }),

  test({ code: 'export default x' }),
  test({ code: 'export default class x {}' }),

  // issue #267: parser opt-in extension list
  test({
    code: 'import json from "./data.json"',
    settings: { 'import/extensions': ['.js'] }, // breaking: remove for v2
  }),

  // JSON
  test({
    code: 'import foo from "./foobar.json";',
    settings: { 'import/extensions': ['.js'] }, // breaking: remove for v2
  }),
  test({
    code: 'import foo from "./foobar";',
    settings: { 'import/extensions': ['.js'] }, // breaking: remove for v2
  }),

  // issue #370: deep commonjs import
  test({
    code: 'import { foo } from "./issue-370-commonjs-namespace/bar"',
    settings: { 'import/ignore': ['foo'] },
  }),

  // issue #348: deep commonjs re-export
  test({
    code: 'export * from "./issue-370-commonjs-namespace/bar"',
    settings: { 'import/ignore': ['foo'] },
  }),

  test({
    code: 'import * as a from "./commonjs-namespace/a"; a.b',
  }),

  // ignore invalid extensions
  test({
    code: 'import { foo } from "./ignore.invalid.extension"',
  }),

];
