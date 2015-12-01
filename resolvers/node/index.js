var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')

exports.resolveImport = function resolveImport(source, file, config) {
  if (resolve.isCore(source)) return null

  return resolve.sync(source, opts(path.dirname(file), config))
}

function opts(basedir, config) {
  return assign({},
    config,
    {
      basedir: basedir,
      packageFilter: packageFilter,

    })
}

function packageFilter(pkg) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}
