"use strict";

var
  resolve = require("../resolve"),
  getExports = require("../getExports");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context.getFilename());
      if (path == null) {
        return;
      }

      var
        imports = getExports(path),
        names = imports.named;

      // if there are no exports, may be a commonjs module.
      // TODO: "interop" mode that attempts to read module.exports, exports member assignments?
      if (names.size === 0 && !imports.hasDefault && context.options[0] !== "es6-only") {
        return;
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== "ImportSpecifier") {
          return;
        }
        if (!names.has(im.imported.name)){
          context.report(im.imported, "Name not found in module.");
        }
      });
    }
  };
};
