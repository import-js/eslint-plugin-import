var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve

var file = path.join(__dirname, 'files', 'src', 'jsx', 'dummy.js')
var extensionFile = path.join(__dirname, 'config-extensions', 'src', 'dummy.js')

var absoluteSettings = {
  config: path.join(__dirname, 'files', 'some', 'absolute.path.webpack.config.js'),
}

describe("config", function () {
  it("finds webpack.config.js in parent directories", function () {
    expect(resolve('main-module', file)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("finds absolute webpack.config.js files", function () {
    expect(resolve('foo', file, absoluteSettings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'))
  })

  it("finds compile-to-js configs", function () {
    var settings = {
      config: path.join(__dirname, './files/webpack.config.babel.js'),
    }

    expect(resolve('main-module', file, settings))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("finds compile-to-js config in parent directories", function () {
    expect(resolve('main-module', extensionFile))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'config-extensions', 'src', 'main-module.js'))
  })

  it("finds the first config with a resolve section", function () {
    var settings = {
      config: path.join(__dirname, './files/webpack.config.multiple.js'),
    }

    expect(resolve('main-module', file, settings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("finds the config at option config-index", function () {
    var settings = {
      config: path.join(__dirname, './files/webpack.config.multiple.js'),
      'config-index': 2,
    }

    expect(resolve('foo', file, settings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'))
  })

  it("doesn't swallow config load errors (#435)", function () {
    var settings = {
      config: path.join(__dirname, './files/webpack.config.garbage.js'),
    }
    expect(function () { resolve('foo', file, settings) }).to.throw(Error)
  })

  it("finds config object when config is an object", function () {
    var settings = {
      config: require(path.join(__dirname, 'files', 'some', 'absolute.path.webpack.config.js')),
    }
    expect(resolve('foo', file, settings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'))
  })

  it("finds the first config with a resolve section when config is an array of config objects", function () {
    var settings = {
      config: require(path.join(__dirname, './files/webpack.config.multiple.js')),
    }

    expect(resolve('main-module', file, settings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("finds the config at option config-index when config is an array of config objects", function () {
    var settings = {
      config: require(path.join(__dirname, './files/webpack.config.multiple.js')),
      'config-index': 2,
    }

    expect(resolve('foo', file, settings)).to.have.property('path')
        .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'))
  })

})
