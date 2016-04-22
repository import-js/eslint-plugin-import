var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve


var file = path.join(__dirname, 'files', 'src', 'dummy.js')

describe("fallback", function () {
  it("works", function () {
    expect(resolve('fb-module', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'fallback', 'fb-module.js'))
  })
  it("really works", function () {
    expect(resolve('jsx/some-fb-file', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'fallback', 'jsx', 'some-fb-file.js'))
  })
  it("prefer root", function () {
    expect(resolve('jsx/some-file', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'jsx', 'some-file.js'))
  })
  it("supports definition as an array", function () {
    expect(resolve('fb-module', file, { config: "webpack.array-root.config.js" }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'fallback', 'fb-module.js'))
  })
})
