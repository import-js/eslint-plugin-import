import * as fs from 'fs'
import { expect } from 'chai'
import parse from 'eslint-module-utils/parse'

import { getFilename, makeNaiveSpy } from '../utils'

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

  it('passes expected parserOptions to custom parser', function () {
    const parseSpy = makeNaiveSpy()
    const parserOptions = { ecmaFeatures: { jsx: true } }
    require('./parseStubParser').parse = parseSpy
    parse(path, content, { settings: {}, parserPath: require.resolve('./parseStubParser'), parserOptions: parserOptions })
    expect(parseSpy.callCount).to.equal(1)
    expect(parseSpy.lastCallArguments[0]).to.equal(content)
    expect(parseSpy.lastCallArguments[1]).to.be.an('object')
    expect(parseSpy.lastCallArguments[1]).to.not.equal(parserOptions)
    expect(parseSpy.lastCallArguments[1])
      .to.have.property('ecmaFeatures')
        .that.is.eql(parserOptions.ecmaFeatures)
        .and.is.not.equal(parserOptions.ecmaFeatures)
    expect(parseSpy.lastCallArguments[1]).to.have.property('attachComment', true)
    expect(parseSpy.lastCallArguments[1]).to.have.property('filePath', path)
  })

})
