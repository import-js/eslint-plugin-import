'use strict'

var path = require('path')
  , resolve = require('resolve')
  , assign = require('object-assign')


function opts(basedir, settings) {
  // pulls all items from 'import/resolve'
  return assign( { }
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
    return resolve.sync(p, opts( path.dirname(context.getFilename())
                               , context.settings))
  } catch (err) {
    if (err.message.indexOf('Cannot find module') === 0) {
      return null
    }

    throw err
  }
}

module.exports.relative = function (p, r, settings) {
  try {

    return resolve.sync(p, opts(path.dirname(r), settings))

  } catch (err) {

    if (err.message.indexOf('Cannot find module') === 0) return null

    throw err // else

  }
}
