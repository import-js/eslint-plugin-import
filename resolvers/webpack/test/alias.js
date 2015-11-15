import { expect } from 'chai'
import resolve from '../index'

import path from 'path'

const file = path.join(__dirname, 'files', 'dummy.js')

describe("resolve.alias", () => {
  it("works", () => {
    expect(resolve('foo', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'))
  })
})
