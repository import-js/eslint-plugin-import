import path from 'path'
import { linter } from 'eslint'
import semver from 'semver'

// warms up the module cache. this import takes a while (>500ms)
import 'babel-eslint'

export function testFilePath(relativePath) {
  return path.join(process.cwd(), './tests/files', relativePath)
}

export const FILENAME = testFilePath('foo.js')

export function testVersion(specifier, t) {
  return semver.satisfies(linter.version, specifier) && test(t)
}

export function test(t) {
  return Object.assign({
    filename: FILENAME,
  }, t, {
    parserOptions: Object.assign({
      sourceType: 'module',
      ecmaVersion: 6,
    }, t.parserOptions),
  })
}

export function testContext(settings) {
  return { getFilename: function () { return FILENAME }
         , settings: settings || {} }
}

export function getFilename(file) {
  return path.join(__dirname, '..', 'files', file || 'foo.js')
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
  test({ code: 'const { x, y, ...z } = bar', parser: 'babel-eslint' }),

  // all the exports
  test({ code: 'let x; export { x }' }),
  test({ code: 'let x; export { x as y }' }),

  // not sure about these since they reference a file
  // test({ code: 'export { x } from "./y.js"'}),
  // test({ code: 'export * as y from "./y.js"', parser: 'babel-eslint'}),

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

]
