"use strict";

var Set = require("es6-set");

module.exports = function (context) {
  var
    locals = new Set(),
    namespaces = new Set();
  return {
    "ImportSpecifier": function (node) {
      locals.add(node.local.name);
    },

    "ImportDefaultSpecifier": function (node) {
      locals.add(node.local.name);
    },

    "ImportNamespaceSpecifier": function (node) {
      locals.add(node.local.name);
      namespaces.add(node.local.name);
    },

    "AssignmentExpression": function (node) {
      if (node.left.type !== "Identifier") return;
      if (locals.has(node.left.name)) context.report(node.left,
        "Reassignment of local imported name '" + node.left.name + "'.");
    }
  };
};
