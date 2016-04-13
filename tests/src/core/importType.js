import { expect } from 'chai'
import importType from 'core/importType'

describe('importType(name)', function () {
  it("should return 'builtin' for node.js modules", function() {
    expect(importType('fs')).to.equal('builtin')
    expect(importType('path')).to.equal('builtin')
  })

  it("should return 'external' for non-builtin modules without a relative path", function() {
    expect(importType('lodash')).to.equal('external')
    expect(importType('async')).to.equal('external')
    expect(importType('chalk')).to.equal('external')
    expect(importType('foo')).to.equal('external')
    expect(importType('lodash.find')).to.equal('external')
    expect(importType('lodash/fp')).to.equal('external')
  })

  it("should return 'parent' for internal modules that go through the parent", function() {
    expect(importType('../foo')).to.equal('parent')
    expect(importType('../../foo')).to.equal('parent')
    expect(importType('../bar/foo')).to.equal('parent')
  })

  it("should return 'sibling' for internal modules that are connected to one of the siblings", function() {
    expect(importType('./foo')).to.equal('sibling')
    expect(importType('./foo/bar')).to.equal('sibling')
  })

  it("should return 'index' for sibling index file", function() {
    expect(importType('.')).to.equal('index')
    expect(importType('./')).to.equal('index')
    expect(importType('./index')).to.equal('index')
    expect(importType('./index.js')).to.equal('index')
  })

  it("should return 'unknown' for any unhandled cases", function() {
    expect(importType('/malformed')).to.equal('unknown')
    expect(importType('   foo')).to.equal('unknown')
  })
})
