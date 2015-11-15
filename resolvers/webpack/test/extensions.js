import { expect } from 'chai'
import resolve from '../index'

import path from 'path'

const file = path.join(__dirname, 'files', 'dummy.js')

describe("extensions", () => {
  it("respects the defaults", () => {
    expect(resolve('./extensions/foo', file)).to.exist
        .and.equal(path.join(__dirname, 'files', 'extensions', 'foo.web.js'))
  })
})
