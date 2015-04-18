"use strict";

var getExports = require("eslint-import-core/getExports");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      if (!node.specifiers.some(function (im) { return im.type === "ImportSpecifier"; }))
        return; // no named imports

      var imports = getExports(node.source.value, context);
      if (imports == null) return;

      var names = imports.named;

      node.specifiers.forEach(function (im) {
        if (im.type !== "ImportSpecifier") return;

        if (!names.has(im.imported.name))
          context.report(im.imported, im.imported.name + " not found in '" + node.source.value + "'");
      });
    }
  };
};
