var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolveImport


var file = path.join(__dirname, 'files', 'src', 'dummy.js')

describe("root", function () {
  it("works", function () {
    expect(resolve('main-module', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })
  it("really works", function () {
    expect(resolve('jsx/some-file', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'src', 'jsx', 'some-file.js'))
  })
})
