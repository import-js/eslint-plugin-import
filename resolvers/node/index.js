var resolve = require('resolve')
  , path = require('path')

exports.resolveImport = function resolveImport(source, file, settings) {
  if (resolve.isCore(source)) return null

  return resolve.sync(source, opts(path.dirname(file), settings))
}

function opts(basedir, settings) {
  // pulls all items from 'import/resolve'
  return Object.assign( {}
                      , settings && settings['import/resolve']
                      , { basedir: basedir }
                      )
}

