var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve

var file = path.join(__dirname, 'files', 'dummy.js')

describe("resolve.moduleDirectories", function () {

  it("finds a node module", function () {
    expect(resolve('some-module', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'node_modules', 'some-module', 'index.js'))
  })

  it("finds a bower module", function () {
    expect(resolve('typeahead.js', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'))
  })

})
