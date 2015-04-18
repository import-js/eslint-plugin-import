"use strict";

var
  espree = require("espree"),
  fs = require("fs");

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

module.exports = function parse(path) {
  return espree.parse(fs.readFileSync(path), {ecmaFeatures: PARSER_DEFAULTS});
};
