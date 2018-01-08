import { expect } from 'chai'

import docsUrl from '../../../src/docsUrl'

describe('docsUrl', function () {
  it('returns the rule documentation URL when given a rule name', function () {
    expect(docsUrl('foo')).to.equal('https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/foo.md')
  })

  it('supports an optional commit hash parameter', function () {
    expect(docsUrl('foo', 'bar')).to.equal('https://github.com/benmosher/eslint-plugin-import/blob/bar/docs/rules/foo.md')
  })
})
