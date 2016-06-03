var chai =  require('chai')
  , expect = chai.expect
  , path = require('path')

var resolve = require('../index').resolve


var file = path.join(__dirname, 'files', 'dummy.js')

describe("inline loader syntax", function () {

  it("strips bang-loaders", function () {
    expect(resolve('css-loader!./src/main-module', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("strips loader query string", function () {
    expect(resolve('some-loader?param=value!./src/main-module', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("strips resource query string", function () {
    expect(resolve('./src/main-module?otherParam=otherValue', file))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

  it("strips everything", function () {
    expect(resolve('some-loader?param=value!./src/main-module?otherParam=otherValue', file))
      .to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })

})

