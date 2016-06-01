var chai = require('chai')
  , expect = chai.expect
  , path = require('path')

var webpack = require('../index')

var file = path.join(__dirname, 'files', 'dummy.js')

describe("externals", function () {
  it("works on just a string", function () {
    var resolved = webpack.resolve('bootstrap', file)
    expect(resolved).to.have.property('found', true)
    expect(resolved).to.have.property('path', null)
  })

  it("works on object-map", function () {
    var resolved = webpack.resolve('jquery', file)
    expect(resolved).to.have.property('found', true)
    expect(resolved).to.have.property('path', null)
  })

  it("works on a function", function () {
    var resolved = webpack.resolve('underscore', file)
    expect(resolved).to.have.property('found', true)
    expect(resolved).to.have.property('path', null)
  })

  it("returns null for core modules", function () {
    var resolved = webpack.resolve('fs', file)
    expect(resolved).to.have.property('found', true)
    expect(resolved).to.have.property('path', null)
  })
})
