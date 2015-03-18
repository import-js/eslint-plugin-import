/**
 * @fileOverview Ensures that an imported relative path exists, relative to the currently linting file.
 * @author Ben Mosher
 */

"use strict";

var
  resolve = require("resolve"),
  path = require("path");

var EXTENSIONS = [".js"];

function extensionsFromOptions(options) {
  return options[0];
}

module.exports = function (context) {
  var extensions = extensionsFromOptions(context.options) || EXTENSIONS;
  return {
    "ImportDeclaration": function (node) {
      try {
        // TODO: async
        resolve.sync(node.source.value, {
          basedir: path.dirname(context.getFilename()),
          extensions: extensions
        });
      } catch (err) {
        if (err.message.indexOf("Cannot find module") === 0) {
          context.report(node.source, "Imported file does not exist.");
        }
      }
    }
  };
};
