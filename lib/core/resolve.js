'use strict'

var path = require('path')
  , resolve = require('resolve')
  , assign = require('object-assign')

/**
 * wrapper around resolve
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path
 */
module.exports = function (p, context) {

  // pulls all items from 'import.resolve'
  var opts = assign( { }
                   , context.settings['import.resolve']
                   , { basedir: path.dirname(context.getFilename()) }
                   )

  try {
    return resolve.sync(p, opts)
  } catch (err) {
    if (err.message.indexOf('Cannot find module') === 0) {
      return null
    }

    throw err
  }
}

module.exports.relative = function (p, r, settings) {
  var opts = assign( { }
                 , settings['import.resolve']
                 , { basedir: path.dirname(r) }
                 )

  try {

    return resolve.sync(p, opts)

  } catch (err) {

    if (err.message.indexOf('Cannot find module') === 0) return null

    throw err // else

  }
}
