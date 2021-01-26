'use strict';

const chai =  require('chai');
const expect = chai.expect;
const path = require('path');

const resolve = require('../index').resolve;


const file = path.join(__dirname, 'files', 'src', 'dummy.js');
const webpackDir = path.join(__dirname, 'different-package-location');

describe('root', function () {
  it('works', function () {
    expect(resolve('main-module', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
  });
  it('really works', function () {
    expect(resolve('jsx/some-file', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'jsx', 'some-file.js'));
  });
  it('supports definition as an array', function () {
    expect(resolve('main-module', file, { config: 'webpack.array-root.config.js' }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
    expect(resolve('typeahead', file, { config: 'webpack.array-root.config.js' }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'));
  });
  it('supports definition as a function', function () {
    expect(resolve('main-module', file, { config: 'webpack.function.config.js' }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
    expect(resolve('typeahead', file, { config: 'webpack.function.config.js' }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'));
  });
  it('supports passing a different directory to load webpack from', function () {
    // Webpack should still be able to resolve the config here
    expect(resolve('main-module', file, { config: 'webpack.config.js', cwd: webpackDir }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
    expect(resolve('typeahead', file, { config: 'webpack.config.js', cwd: webpackDir }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'));
  });
});
