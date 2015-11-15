import { expect } from 'chai'
import resolve from '../index'
import path from 'path'

const file = path.join(__dirname, 'files', 'dummy.js')

describe("resolve.moduleDirectories", () => {
  it("finds a node module", () => {
    expect(resolve('some-module', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'node_modules', 'some-module', 'index.js'))
  })
})
