var expect = require('chai').expect

var path = require('path')
var node = require('../index.js')

describe("paths", function () {
  it("handles base path relative to CWD", function () {
    expect(node.resolve('../', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, '../index.js'))
  })
})

describe("default options", function () {
  it("finds .json files", function () {
        expect(node.resolve('./data', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, './data.json'))
  })
})
