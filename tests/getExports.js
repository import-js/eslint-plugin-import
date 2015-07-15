'use strict'

var expect = require('chai').expect
  , path = require('path')
var getExports = require('../getExports')

describe('getExports', function () {
  it('should handle ExportAllDeclaration', function () {
    var fakeContext = { getFilename: function () {
                          return path.join(__dirname, 'files', 'foo.js') }
                      , settings: {} }

    var imports
    expect(function () {
      imports = getExports('./export-all', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('foo')).to.be.true

  })

  it('should not throw for a missing file', function () {
    var fakeContext = { getFilename: function () {
                          return path.join(__dirname, 'files', 'foo.js') }
                      , settings: {} }

    var imports
    expect(function () {
      imports = getExports('./does-not-exist', fakeContext)
    }).not.to.throw(Error)

    expect(imports).not.to.exist

  })

  it('should export explicit names for a missing file in exports', function () {
    var fakeContext = { getFilename: function () {
                          return path.join(__dirname, 'files', 'foo.js') }
                      , settings: {} }

    var imports
    expect(function () {
      imports = getExports('./exports-missing', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('bar')).to.be.true

  })

})
