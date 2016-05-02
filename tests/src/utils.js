import path from 'path'
import assign from 'object-assign'

// warms up the module cache. this import takes a while (>500ms)
import 'babel-eslint'

export function testFilePath(relativePath) {
    return path.join(process.cwd(), './tests/files', relativePath)
}

export const FILENAME = testFilePath('foo.js')

export function test(t) {
  return assign({
    filename: FILENAME,
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 6,
    },
  }, t)
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
 * to crash at runtinme
 * @type {Array}
 */
export const SYNTAX_CASES = [

  test({ code: 'for (let { foo, bar } of baz) {}' }),
  test({ code: 'for (let [ foo, bar ] of baz) {}' }),

  test({ code: 'const { x, y } = bar' }),
  test({ code: 'const { x, y, ...z } = bar', parser: 'babel-eslint' }),

  // all the exports
  test({ code: 'export { x }' }),
  test({ code: 'export { x as y }' }),

  // not sure about these since they reference a file
  // test({ code: 'export { x } from "./y.js"'}),
  // test({ code: 'export * as y from "./y.js"', parser: 'babel-eslint'}),

  test({ code: 'export const x = null' }),
  test({ code: 'export var x = null' }),
  test({ code: 'export let x = null' }),

  test({ code: 'export default x' }),
  test({ code: 'export default class x {}' }),

  // issue #267: parser whitelist
  test({ code: 'import json from "./data.json"' }),

 ]
