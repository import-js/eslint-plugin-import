"use strict";

var
  Map = require("es6-map"),
  Set = require("es6-set"),
  traverse = require("estraverse").traverse,
  parse = require("./parse"),
  resolve = require("./resolve");

var exportCache = new Map();

function ExportMap() {
  this.hasDefault = false;
  this.named = new Set();

  this.isCommon = false;
}

ExportMap.get = function (path) {

  var exportMap = exportCache.get(path);
  if (exportMap != null) return exportMap;

  exportMap = ExportMap.parse(path);

  exportCache.set(path, exportMap);

  // Object.freeze(exportMap);
  // Object.freeze(exportMap.named);

  return exportMap;
};

ExportMap.parse = function (path) {
  var m = new ExportMap();

  parse(path).body.forEach(function (n) {
    m.captureDefault(n);
    m.captureAll(n, path);
    m.captureNamedDeclaration(n);
    m.commonJs(n);
  });

  return m;
};

ExportMap.prototype.captureDefault = function (n) {
  if (n.type !== "ExportDefaultDeclaration") return;

  this.hasDefault = true;
};

ExportMap.prototype.captureAll = function (n, path) {
  if (n.type !== "ExportAllDeclaration") return;

  var deepPath = resolve(n.source.value, path);
  if (deepPath == null) return;

  var remoteMap = ExportMap.get(deepPath);
  remoteMap.named.forEach(function (name) { this.named.add(name); }.bind(this));
};

ExportMap.prototype.captureNamedDeclaration = function (n) {
  if (n.type !== "ExportNamedDeclaration") return;

  // capture declaration
  if (n.declaration != null)
    switch (n.declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        this.named.add(n.declaration.id.name);
        break;
      case "VariableDeclaration":
        n.declaration.declarations.forEach(function (d) {
          this.named.add(d.id.name);
        }.bind(this));
        break;
  }

  // capture specifiers
  n.specifiers.forEach(function (s) {
    this.named.add(s.exported.name);
  }.bind(this));
};

// todo: capture names
ExportMap.prototype.commonJs = function (node) {
  if (this.isCommon) return;

  var map = this;

  traverse(node, {
    fallback: "iteration",
    enter: function (n) {
      if (n.type !== "ExpressionStatement") return;
      var expr = n.expression;

      if (expr.type !== "AssignmentExpression") return;

      if (expr.operator !== "=") return;
      if (expr.left.type !== "MemberExpression") return;

      if (expr.left.object.type !== "Identifier") return;

      if (expr.left.object.name === "module" || expr.left.object.name === "exports") {
        map.isCommon = true;
        this.break();
      }
    }
  });
};

module.exports = ExportMap.get;
