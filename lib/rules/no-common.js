"use strict";

var
  resolve = require("../resolve"),
  getExports = require("../getExports");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context.getFilename());
      if (path == null) { return; }

      var imports = getExports(path);
      if (imports.isCommon) {
        context.report(node.source, "'" + node.source.value + "' is a CommonJS module.");
      }

    }
  }
};
