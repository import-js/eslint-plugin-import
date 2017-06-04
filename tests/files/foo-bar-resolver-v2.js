var path = require('path')

exports.resolve = function (modulePath, sourceFile, config) {
  var fooPathSuffix = '/files/foo.js'
  var exceptionPathSuffix = '/files/exception.js'
  if (sourceFile.indexOf(fooPathSuffix) === sourceFile.length - fooPathSuffix.length) {
    return { found: true, path: path.join(__dirname, 'bar.jsx') }
  }
  else if (sourceFile.indexOf(exceptionPathSuffix) === sourceFile.length - exceptionPathSuffix.length) {
    throw new Error('foo-bar-resolver-v2 resolve test exception')
  }
  else {
    return { found: false }
  }
}

exports.interfaceVersion = 2
