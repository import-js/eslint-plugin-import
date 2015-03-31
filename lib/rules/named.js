"use strict";

var getExports = require("../getExports");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      if (!node.specifiers.some(function (im) { return im.type === "ImportSpecifier"; }))
        return; // no named imports

      var imports = getExports(node.source.value, context);
      if (imports == null) return;

      var names = imports.named;

      // if there are no exports, may be a commonjs module.
      // TODO: "interop" mode that attempts to read module.exports, exports member assignments?
      if (names.size === 0 && !imports.hasDefault && context.options[0] !== "es6-only")
        return;

      node.specifiers.forEach(function (im) {
        if (im.type !== "ImportSpecifier") return;

        if (!names.has(im.imported.name))
          context.report(im.imported, im.imported.name + " not found in '" + node.source.value + "'");
      });
    }
  };
};
