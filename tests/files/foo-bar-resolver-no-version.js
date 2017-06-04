var path = require('path')

exports.resolveImport = function (modulePath, sourceFile, config) {
  var fooPathSuffix = '/files/foo.js'
  var exceptionPathSuffix = '/files/exception.js'
  if (sourceFile.indexOf(fooPathSuffix) === sourceFile.length - fooPathSuffix.length) {
    return path.join(__dirname, 'bar.jsx')
  }
  else if (sourceFile.indexOf(exceptionPathSuffix) === sourceFile.length - exceptionPathSuffix.length) {
    throw new Error('foo-bar-resolver-v1 resolveImport test exception')
  }
  else {
    return undefined
  }
}
