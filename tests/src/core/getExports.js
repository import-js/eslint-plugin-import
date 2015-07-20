'use strict'

var expect = require('chai').expect
  , path = require('path')
var ExportMap = require('../../../src/core/getExports')

function getFilename(file) {
  return path.join(__dirname, '..', '..', 'files', file || 'foo.js')
}

describe('getExports', function () {
  it('should handle ExportAllDeclaration', function () {
    var fakeContext = { getFilename: getFilename
                      , settings: {} }

    var imports
    expect(function () {
      imports = ExportMap.get('./export-all', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('foo')).to.be.true

  })

  it('should not throw for a missing file', function () {
    var fakeContext = { getFilename: getFilename
                      , settings: {} }

    var imports
    expect(function () {
      imports = ExportMap.get('./does-not-exist', fakeContext)
    }).not.to.throw(Error)

    expect(imports).not.to.exist

  })

  it('should export explicit names for a missing file in exports', function () {
    var fakeContext = { getFilename: getFilename
                      , settings: {} }

    var imports
    expect(function () {
      imports = ExportMap.get('./exports-missing', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('bar')).to.be.true

  })

  it('finds exports for an ES7 module with babel-eslint', function () {
    var imports = ExportMap.parse( getFilename('jsx/FooES7.js')
                                 , { 'import/parser': 'babel-eslint' })

    expect(imports).to.exist
    expect(imports).to.have.property('hasDefault', true)
    expect(imports.named.has('Bar')).to.be.true
  })

})
