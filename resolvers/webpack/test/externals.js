'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');

const webpack = require('../index');

const file = path.join(__dirname, 'files', 'dummy.js');

describe("externals", function () {
  it("works on just a string", function () {
    const resolved = webpack.resolve('bootstrap', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it("works on object-map", function () {
    const resolved = webpack.resolve('jquery', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it("works on a function", function () {
    const resolved = webpack.resolve('underscore', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it("returns null for core modules", function () {
    const resolved = webpack.resolve('fs', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });
});
