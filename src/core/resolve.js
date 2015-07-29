'use strict'

var fs = require('fs')
  , path = require('path')
  , resolve = require('resolve')

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath) {
  var dir = path.dirname(filepath)
  if (dir === '/' || dir === '.') return true
  var filenames = fs.readdirSync(dir)
  if (filenames.indexOf(path.basename(filepath)) === -1) {
      return false
  }
  return fileExistsWithCaseSync(dir)
}

function opts(basedir, settings) {
  // pulls all items from 'import/resolve'
  return Object.assign( { }
                      , settings['import/resolve']
                      , { basedir: basedir }
                      )
}

/**
 * wrapper around resolve
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path
 */
module.exports = function (p, context) {

  try {
    var file = resolve.sync(p, opts( path.dirname(context.getFilename())
                                 , context.settings))
    if (!fileExistsWithCaseSync(file)) return null
    return file
  } catch (err) {
    if (err.message.indexOf('Cannot find module') === 0) {
      return null
    }

    throw err
  }
}

module.exports.relative = function (p, r, settings) {
  try {

    var file = resolve.sync(p, opts(path.dirname(r), settings))
    if (!fileExistsWithCaseSync(file)) return null
    return file

  } catch (err) {

    if (err.message.indexOf('Cannot find module') === 0) return null

    throw err // else

  }
}
