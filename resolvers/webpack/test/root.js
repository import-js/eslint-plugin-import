import { expect } from 'chai'
import resolve from '../index'

import path from 'path'

const file = path.join(__dirname, 'files', 'src', 'dummy.js')

describe("root", () => {
  it("works", () => {
    expect(resolve('main-module', file)).to.exist
      .and.equal(path.join(__dirname, 'files', 'src', 'main-module.js'))
  })
})
