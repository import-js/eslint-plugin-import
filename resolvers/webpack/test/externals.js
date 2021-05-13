'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const semver = require('semver');

const webpack = require('../index');

const file = path.join(__dirname, 'files', 'dummy.js');

describe('externals', function () {
  const settingsWebpack5 = {
    config: require(path.join(__dirname, './files/webpack.config.webpack5.js')),
  };

  it('works on just a string', function () {
    const resolved = webpack.resolve('bootstrap', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it('works on object-map', function () {
    const resolved = webpack.resolve('jquery', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it('works on a function', function () {
    const resolved = webpack.resolve('underscore', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it('returns null for core modules', function () {
    const resolved = webpack.resolve('fs', file);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it('works on a function (synchronous) for webpack 5', function () {
    const resolved = webpack.resolve('underscore', file, settingsWebpack5);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  it('works on a function (synchronous) which uses getResolve for webpack 5', function () {
    const resolved = webpack.resolve('graphql', file, settingsWebpack5);
    expect(resolved).to.have.property('found', true);
    expect(resolved).to.have.property('path', null);
  });

  (semver.satisfies(process.version, '> 6') ? describe : describe.skip)('async function in webpack 5', function () {
    const settingsWebpack5Async = () => ({
      config: require(path.join(__dirname, './files/webpack.config.webpack5.async-externals.js')),
    });

    it('prevents using an asynchronous function for webpack 5', function () {
      const resolved = webpack.resolve('underscore', file, settingsWebpack5Async());
      expect(resolved).to.have.property('found', false);
    });

    it('prevents using a function which uses Promise returned by getResolve for webpack 5', function () {
      const resolved = webpack.resolve('graphql', file, settingsWebpack5Async());
      expect(resolved).to.have.property('found', false);
    });
  });
});
