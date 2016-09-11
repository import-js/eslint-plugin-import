import * as fs from 'fs'
import { expect } from 'chai'
import parse from 'core/parse'

import { getFilename } from '../utils'

describe('parse(content, { settings, ecmaFeatures })', function () {
  const path = getFilename('jsx.js')
  let content

  before((done) =>
    fs.readFile(path, { encoding: 'utf8' },
      (err, f) => { if (err) { done(err) } else { content = f; done() }}))

  it('doesn\'t support JSX by default', function () {
    expect(() => parse(path, content, { parserPath: 'espree' })).to.throw(Error)
  })

  it('infers jsx from ecmaFeatures when using stock parser', function () {
    expect(() => parse(path, content, { settings: {}, parserPath: 'espree', parserOptions: { sourceType: 'module', ecmaFeatures: { jsx: true } } }))
      .not.to.throw(Error)
  })

})
