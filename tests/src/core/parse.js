import * as fs from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import parse from 'eslint-module-utils/parse';

import { getFilename } from '../utils';

describe('parse(content, { settings, ecmaFeatures })', function () {
  const path = getFilename('jsx.js');
  const parseStubParser = require('./parseStubParser');
  const parseStubParserPath = require.resolve('./parseStubParser');
  const eslintParser = require('./eslintParser');
  const eslintParserPath = require.resolve('./eslintParser');
  let content;

  before((done) => {
    fs.readFile(
      path,
      { encoding: 'utf8' },
      (err, f) => {
        if (err) {
          done(err);
        } else {
          content = f; done();
        }
      },
    );
  });

  it('doesn\'t support JSX by default', function () {
    expect(() => parse(path, content, { parserPath: 'espree' })).to.throw(Error);
  });

  it('infers jsx from ecmaFeatures when using stock parser', function () {
    expect(() => parse(path, content, { settings: {}, parserPath: 'espree', parserOptions: { ecmaVersion: 2015, sourceType: 'module', ecmaFeatures: { jsx: true } } }))
      .not.to.throw(Error);
  });

  it('passes expected parserOptions to custom parser', function () {
    const parseSpy = sinon.spy();
    const parserOptions = { ecmaFeatures: { jsx: true } };
    parseStubParser.parse = parseSpy;
    parse(path, content, { settings: {}, parserPath: parseStubParserPath, parserOptions });
    expect(parseSpy.callCount, 'custom parser to be called once').to.equal(1);
    expect(parseSpy.args[0][0], 'custom parser to get content as its first argument').to.equal(content);
    expect(parseSpy.args[0][1], 'custom parser to get an object as its second argument').to.be.an('object');
    expect(parseSpy.args[0][1], 'custom parser to clone the parserOptions object').to.not.equal(parserOptions);
    expect(parseSpy.args[0][1], 'custom parser to get ecmaFeatures in parserOptions which is a clone of ecmaFeatures passed in')
      .to.have.property('ecmaFeatures')
      .that.is.eql(parserOptions.ecmaFeatures)
      .and.is.not.equal(parserOptions.ecmaFeatures);
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.attachComment equal to true').to.have.property('attachComment', true);
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.tokens equal to true').to.have.property('tokens', true);
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.range equal to true').to.have.property('range', true);
    expect(parseSpy.args[0][1], 'custom parser to get parserOptions.filePath equal to the full path of the source file').to.have.property('filePath', path);
  });

  it('passes with custom `parseForESLint` parser', function () {
    const parseForESLintSpy = sinon.spy(eslintParser, 'parseForESLint');
    const parseSpy = sinon.spy();
    eslintParser.parse = parseSpy;
    parse(path, content, { settings: {}, parserPath: eslintParserPath });
    expect(parseForESLintSpy.callCount, 'custom `parseForESLint` parser to be called once').to.equal(1);
    expect(parseSpy.callCount, '`parseForESLint` takes higher priority than `parse`').to.equal(0);
  });

  it('throws on context == null', function () {
    expect(parse.bind(null, path, content, null)).to.throw(Error);
  });

  it('throws on unable to resolve parserPath', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null })).to.throw(Error);
  });

  it('takes the alternate parser specified in settings', function () {
    const parseSpy = sinon.spy();
    const parserOptions = { ecmaFeatures: { jsx: true } };
    parseStubParser.parse = parseSpy;
    expect(parse.bind(null, path, content, { settings: { 'import/parsers': { [parseStubParserPath]: ['.js'] } }, parserPath: null, parserOptions })).not.to.throw(Error);
    expect(parseSpy.callCount, 'custom parser to be called once').to.equal(1);
  });

  it('throws on invalid languageOptions', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: null })).to.throw(Error);
  });

  it('throws on non-object languageOptions.parser', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: 'espree' } })).to.throw(Error);
  });

  it('throws on null languageOptions.parser', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: null } })).to.throw(Error);
  });

  it('throws on empty languageOptions.parser', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: {} } })).to.throw(Error);
  });

  it('throws on non-function languageOptions.parser.parse', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: { parse: 'espree' } } })).to.throw(Error);
  });

  it('throws on non-function languageOptions.parser.parse', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: { parseForESLint: 'espree' } } })).to.throw(Error);
  });

  it('requires only one of the parse methods', function () {
    expect(parse.bind(null, path, content, { settings: {}, parserPath: null, languageOptions: { parser: { parseForESLint: () => ({ ast: {} }) } } })).not.to.throw(Error);
  });

  it('uses parse from languageOptions.parser', function () {
    const parseSpy = sinon.spy();
    expect(parse.bind(null, path, content, { settings: {}, languageOptions: { parser: { parse: parseSpy } } })).not.to.throw(Error);
    expect(parseSpy.callCount, 'passed parser to be called once').to.equal(1);
  });

  it('uses parseForESLint from languageOptions.parser', function () {
    const parseSpy = sinon.spy(() => ({ ast: {} }));
    expect(parse.bind(null, path, content, { settings: {}, languageOptions: { parser: { parseForESLint: parseSpy } } })).not.to.throw(Error);
    expect(parseSpy.callCount, 'passed parser to be called once').to.equal(1);
  });

  it('prefers parsers specified in the settings over languageOptions.parser', () => {
    const parseSpy = sinon.spy();
    parseStubParser.parse = parseSpy;
    expect(parse.bind(null, path, content, { settings: { 'import/parsers': { [parseStubParserPath]: ['.js'] } }, parserPath: null, languageOptions: { parser: { parse() {} } } })).not.to.throw(Error);
    expect(parseSpy.callCount, 'custom parser to be called once').to.equal(1);
  });

  it('ignores parser options from language options set to null', () => {
    const parseSpy = sinon.spy();
    parseStubParser.parse = parseSpy;
    expect(parse.bind(null, path, content, { settings: {}, parserPath: 'espree', languageOptions: { parserOptions: null }, parserOptions: { sourceType: 'module', ecmaVersion: 2015, ecmaFeatures: { jsx: true } } })).not.to.throw(Error);
  });

  it('prefers languageOptions.parserOptions over parserOptions', () => {
    const parseSpy = sinon.spy();
    parseStubParser.parse = parseSpy;
    expect(parse.bind(null, path, content, { settings: {}, parserPath: 'espree', languageOptions: { parserOptions: { sourceType: 'module', ecmaVersion: 2015, ecmaFeatures: { jsx: true } } }, parserOptions: { sourceType: 'script' } })).not.to.throw(Error);
  });

  it('passes ecmaVersion and sourceType from languageOptions to parser', () => {
    const parseSpy = sinon.spy();
    const languageOptions = { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } };
    parseStubParser.parse = parseSpy;
    parse(path, content, { settings: {}, parserPath: parseStubParserPath, languageOptions });
    expect(parseSpy.args[0][1], 'custom parser to clone the parserOptions object').to.not.equal(languageOptions);
    expect(parseSpy.args[0][1], 'custom parser to get ecmaFeatures in parserOptions which is a clone of ecmaFeatures passed in')
      .to.have.property('ecmaFeatures')
      .that.is.eql(languageOptions.parserOptions.ecmaFeatures)
      .and.is.not.equal(languageOptions.parserOptions.ecmaFeatures);
    expect(parseSpy.args[0][1], 'custom parser to get ecmaVersion in parserOptions from languageOptions').to.have.property('ecmaVersion', languageOptions.ecmaVersion);
    expect(parseSpy.args[0][1], 'custom parser to get sourceType in parserOptions from languageOptions').to.have.property('sourceType', languageOptions.sourceType);
  });
});
