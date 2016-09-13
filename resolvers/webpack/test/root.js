var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve


var file = path.join(__dirname, 'files', 'src', 'dummy.js')

describe("root", function () {
  it("works", function () {
    expect(resolve('main-module', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })
  it("really works", function () {
    expect(resolve('jsx/some-file', file)).property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'jsx', 'some-file.js'))
  })
  it("supports definition as an array", function () {
    expect(resolve('main-module', file, { config: "webpack.array-root.config.js" }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
    expect(resolve('typeahead', file, { config: "webpack.array-root.config.js" }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'))
  })
  it("supports definition as a function", function () {
    expect(resolve('main-module', file, { config: "webpack.function.config.js" }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
    expect(resolve('typeahead', file, { config: "webpack.function.config.js" }))
      .property('path')
      .to.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'))
  })

})
