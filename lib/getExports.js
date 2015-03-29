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
  this.errors = [];
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

  try {
    var ast = parse(path);
  } catch (err) {
    m.errors.push(err);
    return m; // can't continue
  }

  ast.body.forEach(function (n) {
    m.captureDefault(n);
    m.captureAll(n, path);
    m.captureNamedDeclaration(n);
  });

  m.commonJs(ast);

  return m;
};

ExportMap.prototype.captureDefault = function (n) {
  if (n.type !== "ExportDefaultDeclaration") return;

  this.hasDefault = true;
};

ExportMap.prototype.captureAll = function (n, path) {
  if (n.type !== "ExportAllDeclaration") return;

  try {
    var deepPath = resolve(n.source.value, path);
  } catch (err) {
    this.errors.push(err);
    return;
  }

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
ExportMap.prototype.commonJs = function (ast) {
  var map = this;
  try {
    traverse(ast, {
      fallback: "iteration",
      enter: function (n) {
        if (n.type !== "AssignmentExpression") return;

        if (n.operator !== "=") return;
        if (n.left.type !== "MemberExpression") return;

        if (n.left.object.type !== "Identifier") return;

        if (n.left.object.name === "module" || n.left.object.name === "exports") {
          map.isCommon = true;
          this.break();
        }
      }
    });
  } catch (err) {
    this.errors.push(err);
  }
};

module.exports = ExportMap.get;
