'use strict'

var
  path = require('path'),
  resolve = require('resolve')

/**
 * resolve
 * @param  {[type]} file       [description]
 * @param  {[type]} p          - path
 * @return {[type]} - the full module filesystem path
 */
module.exports = function (p, context) {
  var
    paths = [],
    resolveRoot = context.settings['resolve.root']


  if (resolveRoot != null) paths = paths.concat(resolveRoot)

  try {
    return resolve.sync(p, {
      basedir: path.dirname(context.getFilename()),
      paths: paths
    })
  } catch (err) {
    if (err.message.indexOf('Cannot find module') === 0) {
      return null
    }

    throw err
  }
}

module.exports.relative = function (p, r) {
  try {

    return resolve.sync(p, {
      basedir: path.dirname(r)
    })

  } catch (err) {

    if (err.message.indexOf('Cannot find module') === 0) return null

    throw err // else

  }
}
