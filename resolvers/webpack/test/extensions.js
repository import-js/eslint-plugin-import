var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolveImport


var file = path.join(__dirname, 'files', 'dummy.js')
  , extensions = path.join(__dirname, 'custom-extensions', 'dummy.js')

describe("extensions", function () {
  it("respects the defaults", function () {
    expect(resolve('./foo', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'foo.web.js'))
  })

  describe("resolve.extensions set", function () {
    it("works", function () {
      expect(resolve('./foo', extensions)).to.exist
        .and.equal(path.join(__dirname, 'custom-extensions', 'foo.js'))
    })

    it("replaces defaults", function () {
      expect(function () { resolve('./baz', extensions) }).to.throw(Error)
    })

    it("finds .coffee", function () {
      expect(resolve('./bar', extensions)).to.exist
        .and.equal(path.join(__dirname, 'custom-extensions', 'bar.coffee'))
    })
  })
})
