var fs = require('fs')
  , path = require('path')
  , resolve = require('resolve')

const CASE_INSENSITIVE = fs.existsSync(path.join(__dirname, 'reSOLVE.js'))

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath) {
  // shortcut exit
  if (!fs.existsSync(filepath)) return false

  var dir = path.dirname(filepath)
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/.test(dir)) return true
  var filenames = fs.readdirSync(dir)
  if (filenames.indexOf(path.basename(filepath)) === -1) {
      return false
  }
  return fileExistsWithCaseSync(dir)
}

function fileExists(filepath) {
  if (CASE_INSENSITIVE) {
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
module.exports = function (p, context) {
  function withResolver(resolver) {
    // resolve just returns the core module id, which won't appear to exist
    if (resolver.isCore(p)) return p

    try {
      var file = resolver.sync(p, opts( path.dirname(context.getFilename())
                                     , context.settings))
      if (!fileExists(file)) return null
      return file
    } catch (err) {

      // probably want something more general here
      if (err.message.indexOf('Cannot find module') === 0) {
        return null
      }

      throw err
    }
  }

  const resolvers = (context.settings['import/resolvers'] || ['resolve'])
    .map(require)

  for (let resolver of resolvers) {
    let file = withResolver(resolver)
    if (file) return file
  }

  return null
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
