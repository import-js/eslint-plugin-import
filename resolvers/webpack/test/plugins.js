var chai = require('chai')
  , expect = chai.expect
  , path = require('path')

var webpack = require('../index')

var file = path.join(__dirname, 'files', 'dummy.js')

describe("plugins", function () {
  var resolved, aliasResolved

  before(function () {
    resolved = webpack.resolve('./some/bar', file)
    aliasResolved = webpack.resolve('some-alias/bar', file)
  })

  it("work", function () {
    expect(resolved).to.have.property('found', true)
  })

  it("is correct", function () {
    expect(resolved).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'bar', 'bar.js'))
  })

  it("work with alias", function () {
    expect(aliasResolved).to.have.property('found', true)
  })
})
