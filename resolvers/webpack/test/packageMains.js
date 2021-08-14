'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');

const resolver = require('../');

const file = path.join(__dirname, 'package-mains', 'dummy.js');


describe('packageMains', function () {

  it('captures module', function () {
    expect(resolver.resolve('./module', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module', 'src', 'index.js'));
  });

  it('captures jsnext', function () {
    expect(resolver.resolve('./jsnext', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'jsnext', 'src', 'index.js'));
  });

  it('captures module instead of jsnext', function () {
    expect(resolver.resolve('./module-and-jsnext', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module-and-jsnext', 'src', 'index.js'));
  });

  it('falls back from a missing "module" to "main"', function () {
    expect(resolver.resolve('./module-broken', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module-broken', 'main.js'));
  });

  it('captures webpack', function () {
    expect(resolver.resolve('./webpack', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'webpack', 'webpack.js'));
  });

  it('captures jam (array path)', function () {
    expect(resolver.resolve('./jam', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'jam', 'jam.js'));
  });

  it('uses configured packageMains, if provided', function () {
    expect(resolver.resolve('./webpack', file, { config: 'webpack.alt.config.js' })).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'webpack', 'index.js'));
  });

  it('always defers to module, regardless of config', function () {
    expect(resolver.resolve('./module', file, { config: 'webpack.alt.config.js' })).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module', 'src', 'index.js'));
  });

  it('always defers to jsnext:main, regardless of config', function () {
    expect(resolver.resolve('./jsnext', file, { config: 'webpack.alt.config.js' })).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'jsnext', 'src', 'index.js'));
  });
});
