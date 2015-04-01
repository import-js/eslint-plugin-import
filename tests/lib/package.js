"use strict";

var expect = require("chai").expect;

var path = require("path");

describe("package", function () {
  it("is importable", function () {
    expect(require(path.join(process.cwd()))).to.exist;
  });
  // TODO: it has every rule
});

