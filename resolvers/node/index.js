'use strict';

const resolve = require('resolve/sync');
const isCoreModule = require('is-core-module');
const path = require('path');

const log = require('debug')('eslint-plugin-import:resolver:node');

exports.interfaceVersion = 2;

function opts(file, config, packageFilter) {
  return Object.assign({ // more closely matches Node (#333)
    // plus 'mjs' for native modules! (#939)
    extensions: ['.mjs', '.js', '.json', '.node'],
  }, config, {
    // path.resolve will handle paths relative to CWD
    basedir: path.dirname(path.resolve(file)),
    packageFilter,
  });
}

function identity(x) { return x; }

function packageFilter(pkg, dir, config) {
  let found = false;
  const file = path.join(dir, 'dummy.js');
  if (pkg.module) {
    try {
      resolve(String(pkg.module).replace(/^(?:\.\/)?/, './'), opts(file, config, identity));
      pkg.main = pkg.module;
      found = true;
    } catch (err) {
      log('resolve threw error trying to find pkg.module:', err);
    }
  }
  if (!found && pkg['jsnext:main']) {
    try {
      resolve(String(pkg['jsnext:main']).replace(/^(?:\.\/)?/, './'), opts(file, config, identity));
      pkg.main = pkg['jsnext:main'];
      found = true;
    } catch (err) {
      log('resolve threw error trying to find pkg[\'jsnext:main\']:', err);
    }
  }
  return pkg;
}

exports.resolve = function (source, file, config) {
  log('Resolving:', source, 'from:', file);
  let resolvedPath;

  if (isCoreModule(source)) {
    log('resolved to core');
    return { found: true, path: null };
  }

  // If this looks like a bare package name (not relative, not qualified
  // with an extension) and we're on a fresh enough version of Node.js
  // to have `require.resolve`, attempt that first.
  if (require.resolve && source.indexOf('.') === -1) {
    try {
      resolvedPath = require.resolve(source);
      log('Resolved to:', resolvedPath);
      return { found: true, path: resolvedPath };
    } catch (err) {
      log('require.resolve threw error:', err);
    }
  }

  try {
    const cachedFilter = function (pkg, dir) { return packageFilter(pkg, dir, config); };
    resolvedPath = resolve(source, opts(file, config, cachedFilter));
    log('Resolved to:', resolvedPath);
    return { found: true, path: resolvedPath };
  } catch (err) {
    log('resolve threw error:', err);
    return { found: false };
  }
};
