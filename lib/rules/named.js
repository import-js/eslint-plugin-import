"use strict";

var
  Set = require("es6-set"), // TODO: maybe not this.
  resolve = require("../resolve"),
  fs = require("fs"),
  espree = require("espree");

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context);
      if (path == null) {
        return; // TODO: alternate failure message?
      }
      var tree = espree.parse(fs.readFileSync(path), {ecmaFeatures: context.ecmaFeatures});
      var names = new Set();
      tree.body.forEach(function (n) {
        if (n.type !== "ExportNamedDeclaration") {
          return;
        }
        if (n.declaration != null && n.declaration.id != null) {
          names.add(n.declaration.id.name);
        }
        n.specifiers.forEach(function (s) {
          names.add(s.exported.name);
        });
      });

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
