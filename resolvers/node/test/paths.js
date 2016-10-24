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
  it("ignores .json files if 'extensions' is redefined", function () {
        expect(node.resolve('./data', './test/file.js', { extensions: ['.js'] }))
      .to.have.property('found', false)
  })
})

describe("absolute imports", function () {
  it("handles absolute path", function () {
    expect(node.resolve('project/app/src/components/TopBar', '/home/map/repos/project/app/src/screens/Detail.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, '../TopBar'))
  })
})

