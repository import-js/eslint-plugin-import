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
