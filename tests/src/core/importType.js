import { expect } from 'chai'
import * as path from 'path'

import importType from 'core/importType'

import { testContext } from '../utils'

describe('importType(name)', function () {
  const context = testContext()

  it("should return 'builtin' for node.js modules", function() {
    expect(importType('fs', context)).to.equal('builtin')
    expect(importType('path', context)).to.equal('builtin')
  })

  it("should return 'external' for non-builtin modules without a relative path", function() {
    expect(importType('lodash', context)).to.equal('external')
    expect(importType('async', context)).to.equal('external')
    expect(importType('chalk', context)).to.equal('external')
    expect(importType('foo', context)).to.equal('external')
    expect(importType('lodash.find', context)).to.equal('external')
    expect(importType('lodash/fp', context)).to.equal('external')
  })

  it("should return 'project' for non-builtins resolved outside of node_modules", function () {
    const pathContext = testContext({ "import/resolver": { node: { paths: [ path.join(__dirname, '..', '..', 'files') ] } } })
    expect(importType('importType', pathContext)).to.equal('project')
  })

  it("should return 'parent' for internal modules that go through the parent", function() {
    expect(importType('../foo', context)).to.equal('parent')
    expect(importType('../../foo', context)).to.equal('parent')
    expect(importType('../bar/foo', context)).to.equal('parent')
  })

  it("should return 'sibling' for internal modules that are connected to one of the siblings", function() {
    expect(importType('./foo', context)).to.equal('sibling')
    expect(importType('./foo/bar', context)).to.equal('sibling')
  })

  describe("should return 'index' for sibling index file when", function() {
    it("resolves", function() {
      expect(importType('./importType', context)).to.equal('index')
      expect(importType('./importType/', context)).to.equal('index')
      expect(importType('./importType/index', context)).to.equal('index')
      expect(importType('./importType/index.js', context)).to.equal('index')
    })
    it("doesn't resolve", function() {
      expect(importType('.', context)).to.equal('index')
      expect(importType('./', context)).to.equal('index')
      expect(importType('./index', context)).to.equal('index')
      expect(importType('./index.js', context)).to.equal('index')
    })
  })

  it("should return 'unknown' for any unhandled cases", function() {
    expect(importType('/malformed', context)).to.equal('unknown')
    expect(importType('   foo', context)).to.equal('unknown')
  })
})
