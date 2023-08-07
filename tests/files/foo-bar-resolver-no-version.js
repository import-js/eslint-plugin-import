var assert = require('assert')
var path = require('path')

exports.resolveImport = function (modulePath, sourceFile, config, options) {
  var sourceFileName = path.basename(sourceFile)
  if (sourceFileName === 'foo.js') {
    return path.join(__dirname, 'bar.jsx')
  }
  if (sourceFileName === 'exception.js') {
    throw new Error('foo-bar-resolver-v1 resolveImport test exception')
  }

  assert.ok(options.context, 'the `context` must be presented')

  return undefined;
}
