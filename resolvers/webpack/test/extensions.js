import { expect } from 'chai'
import resolve from '../index'

import path from 'path'

const file = path.join(__dirname, 'files', 'dummy.js')
    , extensions = path.join(__dirname, 'custom-extensions', 'dummy.js')

describe("extensions", () => {
  it("respects the defaults", () => {
    expect(resolve('./foo', file)).to.exist
        .and.equal(path.join(__dirname, 'files', 'foo.web.js'))
  })

  describe("resolve.extensions set", () => {
    it("works", () => {
      expect(resolve('./foo', extensions)).to.exist
        .and.equal(path.join(__dirname, 'custom-extensions', 'foo.js'))
    })

    it("replaces defaults", () => {
      expect(() => resolve('./baz', extensions)).to.throw(Error)
    })

    it("finds .coffee", () => {
      expect(resolve('./bar', extensions)).to.exist
        .and.equal(path.join(__dirname, 'custom-extensions', 'bar.coffee'))
    })
  })
})
