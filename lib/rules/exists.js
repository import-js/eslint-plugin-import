/**
 * @fileOverview Ensures that an imported relative path exists, relative to the currently linting file.
 * @author Ben Mosher
 */

"use strict";

var resolve = require("../resolve");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      if (resolve(node.source.value, context.getFilename()) == null)
        context.report(node.source,
          "Unable to resolve path to module '" + node.source.value + "'.");
    }
  };
};
