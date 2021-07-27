'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');

const webpack = require('../');

const file = path.join(__dirname, 'package-mains', 'dummy.js');


describe('packageMains', function () {
  it('captures module', function () {
    expect(webpack.resolve('./module', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module', 'src', 'index.js'));
  });

  it('captures jsnext', function () {
    expect(webpack.resolve('./jsnext', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'jsnext', 'src', 'index.js'));
  });

  it('captures module instead of jsnext', function () {
    expect(webpack.resolve('./module-and-jsnext', file)).property('path')
      .to.equal(path.join(__dirname, 'package-mains', 'module-and-jsnext', 'src', 'index.js'));
  });
});
