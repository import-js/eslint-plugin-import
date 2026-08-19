var path = require('path');

var nodeResolver = require('eslint-import-resolver-node');

// Simulates resolvers that cannot resolve an absolute path given as a module source string (#3221),
// which is how `no-cycle`'s SCC builder passes the linted file's own path and the imported modules' paths.
// With `onlyFilename` set, only absolute paths with that basename fail,
// so a test can make just the linted file's own path unresolvable.
exports.resolve = function (modulePath, sourceFile, config) {
  if (
    path.isAbsolute(modulePath)
    && (!config || !config.onlyFilename || path.basename(modulePath) === config.onlyFilename)
  ) {
    return { found: false };
  }
  return nodeResolver.resolve(modulePath, sourceFile, config);
};

exports.interfaceVersion = 2;
