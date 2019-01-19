import * as fs from 'fs'
import { expect } from 'chai'
import sinon from 'sinon'
import parse from 'eslint-module-utils/parse'

import { getFilename } from '../utils'

describe('parse(content, { settings, ecmaFeatures })', function () {
  const path = getFilename('jsx.js')
  const parseStubParser = require('./parseStubParser')
  const parseStubParserPath = require.resolve('./parseStubParser')
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
    const parseSpy = sinon.spy()
    const parserOptions = { ecmaFeatures: { jsx: true } }
    parseStubParser.parse = parseSpy
    parse(path, content, { settings: {}, parserPath: parseStubParserPath, parserOptions: parserOptions })
    expect(parseSpy.callCount, 'custom parser to be called once').to.equal(1)
    expect(parseSpy.args[0][0], 'custom parser to get content as its first argument').to.equal(content)
    expect(parseSpy.args[0][1], 'custom parser to get an object as its second argument').to.be.an('object')
    expect(parseSpy.args[0][1], 'custom parser to clone the parserOptions object').to.not.equal(parserOptions)
    expect(parseSpy.args[0][1], 'custom parser to get ecmaFeatures in parserOptions which is a clone of ecmaFeatures passed in')
      .to.have.property('ecmaFeatures')
        .that.is.eql(parserOptions.ecmaFeatures)
        .and.is.not.equal(parserOptions.ecmaFeatures)
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.attachComment equal to true').to.have.property('attachComment', true)
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.tokens equal to true').to.have.property('tokens', true)
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.range equal to true').to.have.property('range', true)
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.filePath equal to the full path of the source file').to.have.property('filePath', path)
  })

  it('throws on context == null', function () {
    expect(parse.bind(null, path, content, null)).to.throw(Error)
  })

  it('throws on unable to resolve parserPath', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null })).to.throw(Error)
  })

  it('takes the alternate parser specified in settings', function () {
    const parseSpy = sinon.spy()
    const parserOptions = { ecmaFeatures: { jsx: true } }
    parseStubParser.parse = parseSpy
    expect(parse.bind(null, path, content, { settings: { 'import/parsers': { [parseStubParserPath]: [ '.js' ] } }, parserPath: null, parserOptions: parserOptions })).not.to.throw(Error)
    expect(parseSpy.callCount, 'custom parser to be called once').to.equal(1)
  })

})
