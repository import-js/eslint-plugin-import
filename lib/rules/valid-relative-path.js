/**
 * @fileOverview Ensures that an imported relative path exists, relative to the currently linting file.
 * @author Ben Mosher
 */

"use strict";

var path = require("path");

var RELATIVE_PATH = new RegExp("^(\.{1,2})?" + path.sep);

function isRelative(p) {
  return RELATIVE_PATH.test(p);
}

function resolveImportPath(context, importPath) {
  return path.resolve(path.dirname(context.getFilename()), importPath);
}

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var importPath = node.source.value;
      if (isRelative(importPath)) {
        context.report(node, resolveImportPath(context, importPath));
      }

      // check file exists
    }
  };
};
