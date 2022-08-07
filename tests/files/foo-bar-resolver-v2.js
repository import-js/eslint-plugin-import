var assert = require('assert')
var path = require('path')

exports.resolve = function (modulePath, sourceFile, config, options) {
  var sourceFileName = path.basename(sourceFile)
  if (sourceFileName === 'foo.js') {
    return { found: true, path: path.join(__dirname, 'bar.jsx') }
  }
  if (sourceFileName === 'exception.js') {
    throw new Error('foo-bar-resolver-v2 resolve test exception')
  }

  assert.ok(options.context, 'the `context` must be presented')

  return { found: false };
};

exports.interfaceVersion = 2;
