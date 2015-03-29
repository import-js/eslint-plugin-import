"use strict";

var
  resolve = require("../resolve"),
  getExports = require("../getExports");

module.exports = function (context) {
  function message(node, errors) {
    var m = "Errors encountered while analysing imported module '" + node.source.value + "'.";

    if (context.options[0] === "include-messages")
      m += "\n" + errors.join("\n");

    return m;
  }

  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context.getFilename());
      if (path == null) return;

      var imports = getExports(path);
      if (imports.errors.length > 0)
        context.report(node.source, message(node, imports.errors));
    }
  };
};
