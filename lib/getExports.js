"use strict";

var
  Map = require("es6-map"),
  Set = require("es6-set"),
  parse = require("./parse");

var exportCache = new Map();

function captureNamedDeclaration(n, names) {
  // capture declaration
  if (n.declaration != null){
    switch (n.declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        names.add(n.declaration.id.name);
        break;
      case "VariableDeclaration":
        n.declaration.declarations.forEach(function (d) {
          names.add(d.id.name);
        });
        break;
    }
  }

  // capture specifiers
  n.specifiers.forEach(function (s) {
    names.add(s.exported.name);
  });
}

// TODO: recursive getExports for more names for ExportAllDeclaration
module.exports = function getExports(path) {

  var exportMap = exportCache.get(path);
  if (exportMap != null) { return exportMap; }

  exportMap = {
    hasDefault: false,
    named: new Set()
  };

  parse(path).body.forEach(function (n) {
    switch (n.type) {
      case "ExportNamedDeclaration":
        captureNamedDeclaration(n, exportMap.named);
        break;

      case "ExportDefaultDeclaration":
        exportMap.hasDefault = true;
        break;
    }
  });

  exportCache.set(path, exportMap);

  // Object.freeze(exportMap);
  // Object.freeze(exportMap.named);

  return exportMap;

};
