import path from 'path'

// warms up the module cache. this import takes a while (>500ms)
require('babel-eslint')

export function testFilePath(relativePath) {
    return path.join(process.cwd(), './tests/files', relativePath)
}

export const FILENAME = testFilePath('foo.js')

export function test(t) {
  return Object.assign({filename: FILENAME, ecmaFeatures: {modules: true}}, t)
}

export function testContext(settings) {
  return { getFilename: function () { return FILENAME }
         , settings: settings || {}
         }
}
