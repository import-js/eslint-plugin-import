var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')

exports.interfaceVersion = 2

exports.resolve = function (source, file, config) {
  if (resolve.isCore(source)) return { found: true, path: null }
  try {
    return { found: true, path: resolve.sync(source, opts(file, config)) }
  } catch (err) {
    return { found: false }
  }
}

function opts(file, config) {
  return assign({},
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,

    })
}

function packageFilter(pkg) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}
