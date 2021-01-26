'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');

const webpack = require('../index');

const file = path.join(__dirname, 'files', 'dummy.js');

describe('plugins', function () {
  let resolved; let aliasResolved;

  before(function () {
    resolved = webpack.resolve('./some/bar', file);
    aliasResolved = webpack.resolve('some-alias/bar', file);
  });

  it('work', function () {
    expect(resolved).to.have.property('found', true);
  });

  it('is correct', function () {
    expect(resolved).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'bar', 'bar.js'));
  });

  it('work with alias', function () {
    expect(aliasResolved).to.have.property('found', true);
  });
});
