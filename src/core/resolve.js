var fs = require('fs')
  , path = require('path')
  , resolve = require('resolve')

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath) {
  // shortcut exit
  if (!fs.existsSync(filepath)) return false

  var dir = path.dirname(filepath)
  if (dir === '/' || dir === '.') return true
  var filenames = fs.readdirSync(dir)
  if (filenames.indexOf(path.basename(filepath)) === -1) {
      return false
  }
  return fileExistsWithCaseSync(dir)
}

function fileExists(filepath, caseSensitive = false) {
  if (caseSensitive) {
    return fileExistsWithCaseSync(filepath)
  } else {
    return fs.existsSync(filepath)
  }
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
module.exports = function (p, context, considerCase) {
  // resolve just returns the core module id, which won't appear to exist
  if (resolve.isCore(p)) return p

  try {
    var file = resolve.sync(p, opts( path.dirname(context.getFilename())
                                   , context.settings))
    if (!fileExists(file, considerCase)) return null
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
    if (!fileExists(file)) return null
    return file

  } catch (err) {

    if (err.message.indexOf('Cannot find module') === 0) return null

    throw err // else

  }
}
