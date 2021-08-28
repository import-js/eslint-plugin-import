'use strict';

const chai =  require('chai');
const expect = chai.expect;
const path = require('path');

const resolve = require('../index').resolve;

const file = path.join(__dirname, 'files', 'src', 'jsx', 'dummy.js');
const extensionFile = path.join(__dirname, 'config-extensions', 'src', 'dummy.js');

const absoluteSettings = {
  config: path.join(__dirname, 'files', 'some', 'absolute.path.webpack.config.js'),
};

describe('config', function () {
  it('finds webpack.config.js in parent directories', function () {
    expect(resolve('main-module', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
  });

  it('finds absolute webpack.config.js files', function () {
    expect(resolve('foo', file, absoluteSettings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'));
  });

  it('finds compile-to-js configs', function () {
    const settings = {
      config: path.join(__dirname, './files/webpack.config.babel.js'),
    };

    expect(resolve('main-module', file, settings))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
  });

  it('finds compile-to-js config in parent directories', function () {
    expect(resolve('main-module', extensionFile))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'config-extensions', 'src', 'main-module.js'));
  });

  it('finds the first config with a resolve section', function () {
    const settings = {
      config: path.join(__dirname, './files/webpack.config.multiple.js'),
    };

    expect(resolve('main-module', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
  });

  it('finds the config at option config-index', function () {
    const settings = {
      config: path.join(__dirname, './files/webpack.config.multiple.js'),
      'config-index': 2,
    };

    expect(resolve('foo', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'));
  });

  it("doesn't swallow config load errors (#435)", function () {
    const settings = {
      config: path.join(__dirname, './files/webpack.config.garbage.js'),
    };
    expect(function () { resolve('foo', file, settings); }).to.throw(Error);
  });

  it('finds config object when config is an object', function () {
    const settings = {
      config: require(path.join(__dirname, 'files', 'some', 'absolute.path.webpack.config.js')),
    };
    expect(resolve('foo', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'));
  });

  it('finds config object when config uses a path relative to working dir', function () {
    const settings = {
      config: './test/files/some/absolute.path.webpack.config.js',
    };
    expect(resolve('foo', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'));
  });

  it('finds the first config with a resolve section when config is an array of config objects', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.config.multiple.js')),
    };

    expect(resolve('main-module', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'));
  });

  it('finds the config at option config-index when config is an array of config objects', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.config.multiple.js')),
      'config-index': 2,
    };

    expect(resolve('foo', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'));
  });

  it('finds the config at option env when config is a function', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.function.config.js')),
      env: {
        dummy: true,
      },
    };

    expect(resolve('bar', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'bar.js'));
  });

  it('finds the config at option env when config is an array of functions', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.function.config.multiple.js')),
      env: {
        dummy: true,
      },
    };

    expect(resolve('bar', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'bar.js'));
  });

  it('passes argv to config when it is a function', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.function.config.js')),
      argv: {
        mode: 'test',
      },
    };

    expect(resolve('baz', file, settings)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'bar', 'bar.js'));
  });

  it('passes a default empty argv object to config when it is a function', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.function.config.js')),
      argv: undefined,
    };

    expect(function () { resolve('baz', file, settings); }).to.not.throw(Error);
  });

  it('prevents async config using', function () {
    const settings = {
      config: require(path.join(__dirname, './files/webpack.config.async.js')),
    };
    const result = resolve('foo', file, settings);

    expect(result).not.to.have.property('path');
    expect(result).to.have.property('found').to.be.false;
  });
});
