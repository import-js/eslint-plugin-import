"use strict";

var expect = require("chai").expect;
var resolve = require("../../lib/resolve");

describe("resolve", function () {
  it("should throw on bad parameters.", function () {
    expect(resolve.bind(null, null, null)).to.throw(Error);
  });
});
