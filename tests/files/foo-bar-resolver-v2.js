var path = require('path')

exports.resolve = function (modulePath, sourceFile, config) {
  var sourceFileName = path.basename(sourceFile)
  if (sourceFileName === 'foo.js') {
    return { found: true, path: path.join(__dirname, 'bar.jsx') }
  }
  else if (sourceFileName === 'exception.js') {
    throw new Error('foo-bar-resolver-v2 resolve test exception')
  }
  else {
    return { found: false }
  }
}

exports.interfaceVersion = 2
