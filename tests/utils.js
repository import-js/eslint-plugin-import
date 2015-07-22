import assign from 'object-assign'
import path from 'path'

export function testFilePath(relativePath) {
    return path.join(process.cwd(), './tests/files', relativePath)
}

export const FILENAME = testFilePath('foo.js')

export function test(t) {
  return assign({filename: FILENAME, ecmaFeatures: {modules: true}}, t)
}

export function testContext(settings) {
  return { getFilename: function () { return FILENAME }
         , settings: settings || {}
         }
}
