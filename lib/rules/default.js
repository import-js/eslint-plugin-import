"use strict";

var
  resolve = require("../resolve"),
  getExports = require("../getExports");

require("array.prototype.find");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context);
      if (path == null) {
        return;
      }

      var defaultSpecifier = node.specifiers.find(function (n) { return n.type === "ImportDefaultSpecifier"; });
      if (!defaultSpecifier) {
        return;
      }

      if (!getExports(path).hasDefault) {
        context.report(defaultSpecifier, "No default export found in module.");
      }
    }
  };
};
