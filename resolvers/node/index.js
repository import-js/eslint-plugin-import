var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')
  , pkgUp = require('pkg-up')
  , fs = require('fs')

var log = require('debug')('eslint-plugin-import:resolver:node')

exports.interfaceVersion = 3

exports.resolve = function (source, file, config) {
  log('Resolving:', source, 'from:', file)
  var resolvedPath

  if (resolve.isCore(source)) {
    log('resolved to core')
    return { found: true, path: null, importType: 'core' }
  }

  try {
    resolvedPath = resolve.sync(source, opts(file, config))
    log('Resolved to:', resolvedPath)
    return { found: true, path: resolvedPath }
  } catch (err) {
    log('resolve threw error:', err)
    return { found: false }
  }
}

function opts(file, config) {
  return assign({
      // more closely matches Node (#333)
      extensions: ['.js', '.json'],
    },
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,

    })
}

exports.getDependencies = function (file) {
  const filepath = pkgUp.sync(file)
  if (!filepath) {
    return null
  }

  try {
    const packageContent = JSON.parse(fs.readFileSync(filepath, 'utf8'))
    return {
      dependencies: packageContent.dependencies || {},
      devDependencies: packageContent.devDependencies || {},
      optionalDependencies: packageContent.optionalDependencies || {},
      peerDependencies: packageContent.peerDependencies || {},
    }
  } catch (e) {
    return null
  }
}

function packageFilter(pkg) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}
