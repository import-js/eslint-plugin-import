var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve


var file = path.join(__dirname, 'files', 'dummy.js')
  , extensions = path.join(__dirname, 'custom-extensions', 'dummy.js')

describe("extensions", function () {
  it("respects the defaults", function () {
    expect(resolve('./foo', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'foo.web.js'))
  })

  describe("resolve.extensions set", function () {
    it("works", function () {
      expect(resolve('./foo', extensions)).to.have.property('path')
        .and.equal(path.join(__dirname, 'custom-extensions', 'foo.js'))
    })

    it("replaces defaults", function () {
      expect(resolve('./baz', extensions)).to.have.property('found', false)
    })

    it("finds .coffee", function () {
      expect(resolve('./bar', extensions)).to.have.property('path')
        .and.equal(path.join(__dirname, 'custom-extensions', 'bar.coffee'))
    })
  })
})
