var chai = require('chai')
  , expect = chai.expect
  , path = require('path')

var webpack = require('../index')

var file = path.join(__dirname, 'files', 'dummy.js')

describe("resolve.alias", function () {
  it("works", function () {
    expect(webpack.resolveImport('foo', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'))
  })
})
