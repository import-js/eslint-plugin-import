"use strict";

var
  Set = require("es6-set"), // TODO: maybe not this.
  resolve = require("../resolve"),
  fs = require("fs"),
  espree = require("espree");

// from eslint/espree README.md
var PARSER_DEFAULTS = {
  // enable parsing of arrow functions
  arrowFunctions: true,

  // enable parsing of let/const
  blockBindings: true,

  // enable parsing of destructured arrays and objects
  destructuring: true,

  // enable parsing of regular expression y flag
  regexYFlag: true,

  // enable parsing of regular expression u flag
  regexUFlag: true,

  // enable parsing of template strings
  templateStrings: true,

  // enable parsing of binary literals
  binaryLiterals: true,

  // enable parsing of ES6 octal literals
  octalLiterals: true,

  // enable parsing unicode code point escape sequences
  unicodeCodePointEscapes: true,

  // enable parsing of default parameters
  defaultParams: true,

  // enable parsing of rest parameters
  restParams: true,

  // enable parsing of for-of statement
  forOf: true,

  // enable parsing computed object literal properties
  objectLiteralComputedProperties: true,

  // enable parsing of shorthand object literal methods
  objectLiteralShorthandMethods: true,

  // enable parsing of shorthand object literal properties
  objectLiteralShorthandProperties: true,

  // Allow duplicate object literal properties (except '__proto__')
  objectLiteralDuplicateProperties: true,

  // enable parsing of generators/yield
  generators: true,

  // enable parsing spread operator
  spread: true,

  // enable parsing classes
  classes: true,

  // enable parsing of modules
  modules: true,

  // enable React JSX parsing
  jsx: true,

  // enable return in global scope
  globalReturn: true
};

module.exports = function (context) {
  return {
    "ImportDeclaration": function (node) {
      var path = resolve(node.source.value, context);
      if (path == null) {
        return; // TODO: alternate failure message?
      }
      var tree = espree.parse(fs.readFileSync(path), {ecmaFeatures: PARSER_DEFAULTS});
      var names = new Set();
      tree.body.forEach(function (n) {
        if (n.type !== "ExportNamedDeclaration") {
          return;
        }

        // capture declaration
        if (n.declaration != null){
          switch (n.declaration.type) {
            case "FunctionDeclaration":
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
      });

      // if there are no named exports, may be a commonjs module.
      // TODO: "interop" mode that attempts to read module.exports, exports member assignments?
      if (names.size === 0 && context.options[0] !== "es6") {
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
