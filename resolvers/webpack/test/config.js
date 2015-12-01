var chai =  require('chai')
  , expect = chai.expect

import { resolveImport as resolve } from '../index'

import path from 'path'

var file = path.join(__dirname, 'files', 'src', 'jsx', 'dummy.js')
var absoluteSettings = {
  config: path.join(__dirname, 'files', 'some', 'absolute.path.webpack.config.js'),
}

describe("config", function () {
  it("finds webpack.config.js in parent directories", function () {
    expect(resolve('main-module', file)).to.exist
        .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })
  it("finds absolute webpack.config.js files", function () {
    expect(resolve('foo', file, absoluteSettings)).to.exist
        .and.equal(path.join(__dirname, 'files', 'some', 'absolutely', 'goofy', 'path', 'foo.js'))
  })
})
