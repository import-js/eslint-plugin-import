import { expect } from 'chai'
import parse from 'core/parse'

import { getFilename } from '../utils'

describe('parse(path, { settings, ecmaFeatures })', function () {
  it("doesn't support JSX by default", function () {
    expect(() => parse(getFilename('jsx.js'), { parserPath: 'espree' })).to.throw(Error)
  })
  it('infers jsx from ecmaFeatures when using stock parser', function () {
    expect(() => parse(getFilename('jsx.js'), { parserPath: 'espree', parserOptions: { sourceType: 'module', ecmaFeatures: { jsx: true } } }))
      .not.to.throw(Error)
  })
})
