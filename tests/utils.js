'use strict'

var assign = require('object-assign')
  , path = require('path')


function testFilePath(relativePath) {
    return path.join(process.cwd(), './tests/files', relativePath)
}
exports.testFilePath = testFilePath


var FILENAME = testFilePath('foo.js')
exports.FILENAME = FILENAME


exports.test = function test(t) {
  return assign({filename: FILENAME, ecmaFeatures: {modules: true}}, t)
}

exports.testContext = function (settings) {
    return { getFilename: function () { return FILENAME }
           , settings: settings || {}
           }
}
