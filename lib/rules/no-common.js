"use strict";

var getExports = require("../getExports");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {

      var imports = getExports(node.source.value, context);
      if (imports == null) return;

      if (imports.isCommon)
        context.report(node.source, "'" + node.source.value + "' is a CommonJS module.");
    }
  };
};
