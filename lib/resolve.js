"use strict";

var
  path = require("path"),
  resolve = require("resolve");

/**
 * resolve
 * @param  {[type]} file       [description]
 * @param  {[type]} path       [description]
 * @param  {[type]} extensions [description]
 * @return {[type]}            [description]
 */
module.exports = function (p, file) {
  try {
    return resolve.sync(p, {
      basedir: path.dirname(file)
    });
  } catch (err) {
    if (err.message.indexOf("Cannot find module") === 0) {
      return null;
    } else {
      throw err;
    }
  }
};
