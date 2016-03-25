var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve

var file = path.join(__dirname, 'files', 'src', 'jsx', 'dummy.js')
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
})
