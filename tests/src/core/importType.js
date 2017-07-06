import { expect } from 'chai'
import * as path from 'path'

import importType from 'core/importType'

import { testContext } from '../utils'

describe('importType(name)', function () {
  const context = testContext()

  it("should return 'absolute' for paths starting with a /", function() {
    expect(importType('/', context)).to.equal('absolute')
    expect(importType('/path', context)).to.equal('absolute')
    expect(importType('/some/path', context)).to.equal('absolute')
  })

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

  it("should return 'external' for scopes packages", function() {
    expect(importType('@cycle/core', context)).to.equal('external')
    expect(importType('@cycle/dom', context)).to.equal('external')
  })

  it("should return 'internal' for non-builtins resolved outside of node_modules", function () {
    const pathContext = testContext({ "import/resolver": { node: { paths: [ path.join(__dirname, '..', '..', 'files') ] } } })
    expect(importType('importType', pathContext)).to.equal('internal')
  })

  it("should return 'parent' for internal modules that go through the parent", function() {
    expect(importType('../foo', context)).to.equal('parent')
    expect(importType('../../foo', context)).to.equal('parent')
    expect(importType('../bar/foo', context)).to.equal('parent')
  })

  it("should return 'sibling' for internal modules that are connected to one of the siblings", function() {
    expect(importType('./foo', context)).to.equal('sibling')
    expect(importType('./foo/bar', context)).to.equal('sibling')
    expect(importType('./importType', context)).to.equal('sibling')
    expect(importType('./importType/', context)).to.equal('sibling')
    expect(importType('./importType/index', context)).to.equal('sibling')
    expect(importType('./importType/index.js', context)).to.equal('sibling')
  })

  it("should return 'index' for sibling index file", function() {
    expect(importType('.', context)).to.equal('index')
    expect(importType('./', context)).to.equal('index')
    expect(importType('./index', context)).to.equal('index')
    expect(importType('./index.js', context)).to.equal('index')
  })

  it("should return 'unknown' for any unhandled cases", function() {
    expect(importType('@malformed', context)).to.equal('unknown')
    expect(importType('  /malformed', context)).to.equal('unknown')
    expect(importType('   foo', context)).to.equal('unknown')
  })

  it("should return 'builtin' for additional core modules", function() {
    // without extra config, should be marked external
    expect(importType('electron', context)).to.equal('external')

    const electronContext = testContext({ 'import/core-modules': ['electron'] })
    expect(importType('electron', electronContext)).to.equal('builtin')
  })

  it("should return 'external' for module from 'node_modules' with default config", function() {
    expect(importType('builtin-modules', context)).to.equal('external')
  })

  it("should return 'internal' for module from 'node_modules' if 'node_modules' missed in 'external-module-folders'", function() {
    const foldersContext = testContext({ 'import/external-module-folders': [] })
    expect(importType('builtin-modules', foldersContext)).to.equal('internal')
  })

  it("should return 'external' for module from 'node_modules' if 'node_modules' contained in 'external-module-folders'", function() {
    const foldersContext = testContext({ 'import/external-module-folders': ['node_modules'] })
    expect(importType('builtin-modules', foldersContext)).to.equal('external')
  })
})
