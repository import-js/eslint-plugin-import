var chai = require('chai')
  , expect = chai.expect
  , path = require('path')

var webpack = require('../')

var file = path.join(__dirname, 'package-mains', 'dummy.js')


describe("packageMains", function () {

  it("captures jsnext", function () {
    expect(webpack.resolveImport('./jsnext', file))
      .to.equal(path.join(__dirname, 'package-mains', 'jsnext', 'src', 'index.js'))
  })

  it("captures webpack", function () {
    expect(webpack.resolveImport('./webpack', file))
      .to.equal(path.join(__dirname, 'package-mains', 'webpack', 'webpack.js'))
  })

  it("uses configured packageMains, if provided", function () {
    expect(webpack.resolveImport('./webpack', file, { config: 'webpack.alt.config.js' }))
      .to.equal(path.join(__dirname, 'package-mains', 'webpack', 'index.js'))
  })

  it("always defers to jsnext:main, regardless of config", function () {
    expect(webpack.resolveImport('./jsnext', file, { config: 'webpack.alt.config.js' }))
      .to.equal(path.join(__dirname, 'package-mains', 'jsnext', 'src', 'index.js'))
  })

})
