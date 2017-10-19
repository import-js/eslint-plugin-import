var expect = require('chai').expect

var path = require('path')
var node = require('../index.js')

describe("paths", function () {
  it("handles base path relative to CWD", function () {
    expect(node.resolve('../', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, '../index.js'))
  })
})


describe("core", function () {
  it("returns found, but null path, for core Node modules", function () {
    var resolved = node.resolve('fs', "./test/file.js")
    expect(resolved).has.property("found", true)
    expect(resolved).has.property("path", null)
  })
})


describe("default options", function () {

  it("finds .json files", function () {
    expect(node.resolve('./data', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './data.json'))
  })

  it("ignores .json files if 'extensions' is redefined", function () {
    expect(node.resolve('./data', './test/file.js', { extensions: ['.js'] }))
      .to.have.property('found', false)
  })

  it("finds mjs modules, with precedence over .js", function () {
    expect(node.resolve('./native', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './native.mjs'))
  })

  it("still finds .js if explicit", function () {
    expect(node.resolve('./native.js', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './native.js'))
  })

})
