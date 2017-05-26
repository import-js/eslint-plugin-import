import * as fs from 'fs'
import { expect } from 'chai'
import sinon from 'sinon'
import parse from 'eslint-module-utils/parse'

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

  it('passes expected parserOptions to custom parser', function () {
    const parseSpy = sinon.spy()
    const parserOptions = { ecmaFeatures: { jsx: true } }
    require('./parseStubParser').parse = parseSpy
    parse(path, content, { settings: {}, parserPath: require.resolve('./parseStubParser'), parserOptions: parserOptions })
    expect(parseSpy.callCount, 'parse to be called once').to.equal(1)
    expect(parseSpy.args[0][0], 'parse to get content as its first argument').to.equal(content)
    expect(parseSpy.args[0][1], 'parse to get an object as its second argument').to.be.an('object')
    expect(parseSpy.args[0][1], 'parse to clone the parserOptions object').to.not.equal(parserOptions)
    expect(parseSpy.args[0][1], 'parse to get ecmaFeatures in parserOptions which is a clone of ecmaFeatures passed in')
      .to.have.property('ecmaFeatures')
        .that.is.eql(parserOptions.ecmaFeatures)
        .and.is.not.equal(parserOptions.ecmaFeatures)
    expect(parseSpy.args[0][1], 'parse to get parserOptions.attachComment equal to true').to.have.property('attachComment', true)
    expect(parseSpy.args[0][1], 'parse to get parserOptions.filePath equal to the full path of the source file').to.have.property('filePath', path)
  })

})
