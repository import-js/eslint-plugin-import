/**
 * @fileOverview Ensures that an imported relative path exists, relative to the currently linting file.
 * @author Ben Mosher
 */

"use strict";

var
  path = require("path"),
  fs = require("fs");

var RELATIVE_PATH = new RegExp("^(\.{1,2})?" + path.sep);

var EXTENSIONS = [".js"];

function isRelative(p) {
  return RELATIVE_PATH.test(p);
}

function resolveImportPath(context, importPath) {
  return path.resolve(path.dirname(context.getFilename()), importPath);
}

function exists(resolvedPath) {
  return EXTENSIONS.some(function (ext) { return fs.existsSync(resolvedPath + ext); });
}

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var importPath = node.source.value;
      if (isRelative(importPath) && !exists(resolveImportPath(context, importPath))) {
        context.report(node, "Imported file does not exist.");
      }
    }
  };
};
