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

      var imports = getExports(path);
      if (imports.named.size === 0 && context.options[0] !== "es6-only") {
        return; // ignore for commonjs compatibility
      }

      if (!imports.hasDefault) {
        context.report(defaultSpecifier, "No default export found in module.");
      }
    }
  };
};
