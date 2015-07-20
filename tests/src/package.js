"use strict";

var expect = require("chai").expect;

var path = require("path")
  , fs = require("fs");

describe("package", function () {

  it("is importable", function () {
    expect(require(process.cwd())).to.exist;
  });

  it("has every rule", function (done) {
    var module = require(process.cwd());

    fs.readdir(
      path.join(process.cwd(), "lib", "rules")
    , function (err, files) {
        expect(err).not.to.exist;

        files.forEach(function (f) {
          expect(module.rules).to.have
            .property(path.basename(f, ".js"));
        });

        done();
      });
  });

  it("has config for every rule", function (done) {
    var module = require(process.cwd());

    fs.readdir(
      path.join(process.cwd(), "lib", "rules")
    , function (err, files) {
        expect(err).not.to.exist;

        files.forEach(function (f) {
          expect(module.rulesConfig).to.have
            .property(path.basename(f, ".js"));
        });

        done();
      });
  });
});

