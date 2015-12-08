var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')

exports.resolveImport = function resolveImport(source, file, config) {
  if (resolve.isCore(source)) return null

  return resolve.sync(source, opts(file, config))
}

function opts(file, config) {
  // var paths = []

  // if (process.env.NODE_PATH) {
  //   paths = process.env.NODE_PATH.split(path.delimiter)
  // }

  // if (config.paths) {
  //   paths.push.apply(paths, config.paths)
  // }

  return assign({},
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,
      // paths: paths,
    })
}

function packageFilter(pkg) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}
