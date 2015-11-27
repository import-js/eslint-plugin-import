var chai = require('chai')
  , expect = chai.expect
  , path = require('path')

var webpack = require('../index')

var file = path.join(__dirname, 'files', 'dummy.js')

describe("externals", function () {
  it("works on just a string", function () {
    expect(webpack.resolveImport('bootstrap', file)).to.be.null
  })

  it("works on object-map", function () {
    expect(webpack.resolveImport('jquery', file)).to.be.null
  })

  it("returns null for core modules", function () {
    expect(webpack.resolveImport('fs', file)).to.be.null
  })
})
