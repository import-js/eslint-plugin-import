"use strict";

var
  assign = require("object-assign"),
  path = require("path");

var FILENAME = path.join(process.cwd(), "./tests/files", "foo.js");

exports.test = function test(t) {
  return assign({filename: FILENAME, ecmaFeatures: {modules: true}}, t);
};
