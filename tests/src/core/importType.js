import { expect } from 'chai'
import * as path from 'path'

import importType from 'core/importType'

import { testContext, testFilePath } from '../utils'

describe('importType(name)', function () {
  const context = testContext()
  const pathToTestFiles = path.join(__dirname, '..', '..', 'files')

  it("should return 'absolute' for paths starting with a /", function() {
    expect(importType('/', context)).to.equal('absolute')
    expect(importType('/path', context)).to.equal('absolute')
    expect(importType('/some/path', context)).to.equal('absolute')
  })

  it("should return 'builtin' for node.js modules", function() {
    expect(importType('fs', context)).to.equal('builtin')
    expect(importType('path', context)).to.equal('builtin')
  })

  it("should return 'builtin' for node.js modules (webpack resolver)", function() {
    const webpackContext = testContext({ 'import/resolver': 'webpack' })
    expect(importType('fs', webpackContext)).to.equal('builtin')
    expect(importType('path', webpackContext)).to.equal('builtin')
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
    expect(importType('@cycle/', context)).to.equal('external')
    expect(importType('@cycle/core', context)).to.equal('external')
    expect(importType('@cycle/dom', context)).to.equal('external')
    expect(importType('@some-thing/something', context)).to.equal('external')
    expect(importType('@some-thing/something/some-module', context)).to.equal('external')
    expect(importType('@some-thing/something/some-directory/someModule.js', context)).to.equal('external')
  })

  it("should return 'external' for external modules that redirect to its parent module using package.json", function() {
    expect(importType('eslint-import-test-order-redirect/module', context)).to.equal('external')
    expect(importType('@eslint/import-test-order-redirect-scoped/module', context)).to.equal('external')
  })

  it("should return 'internal' for non-builtins resolved outside of node_modules", function () {
    const pathContext = testContext({ 'import/resolver': { node: { paths: [pathToTestFiles] } } })
    expect(importType('importType', pathContext)).to.equal('internal')
  })

  it("should return 'internal' for scoped packages resolved outside of node_modules", function () {
    const pathContext = testContext({ 'import/resolver': { node: { paths: [pathToTestFiles] } } })
    expect(importType('@importType/index', pathContext)).to.equal('internal')
  })

  it("should return 'internal' for internal modules that are referenced by aliases", function () {
    const pathContext = testContext({ 'import/resolver': { node: { paths: [pathToTestFiles] } } })
    expect(importType('@my-alias/fn', pathContext)).to.equal('internal')
    expect(importType('@importType', pathContext)).to.equal('internal')
  })

  it("should return 'internal' for aliased internal modules that look like core modules (node resolver)", function () {
    const pathContext = testContext({ 'import/resolver': { node: { paths: [pathToTestFiles] } } })
    expect(importType('constants/index', pathContext)).to.equal('internal')
    expect(importType('constants/', pathContext)).to.equal('internal')
    // resolves exact core modules over internal modules
    expect(importType('constants', pathContext)).to.equal('builtin')
  })

  it("should return 'internal' for aliased internal modules that look like core modules (webpack resolver)", function () {
    const webpackConfig = { resolve: { modules: [pathToTestFiles, 'node_modules'] } }
    const pathContext = testContext({ 'import/resolver': { webpack: { config: webpackConfig } } })
    expect(importType('constants/index', pathContext)).to.equal('internal')
    expect(importType('constants/', pathContext)).to.equal('internal')
    expect(importType('constants', pathContext)).to.equal('internal')
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
    expect(importType('  /malformed', context)).to.equal('unknown')
    expect(importType('   foo', context)).to.equal('unknown')
  })

  it("should return 'builtin' for additional core modules", function() {
    // without extra config, should be marked external
    expect(importType('electron', context)).to.equal('external')
    expect(importType('@org/foobar', context)).to.equal('external')

    const electronContext = testContext({ 'import/core-modules': ['electron'] })
    expect(importType('electron', electronContext)).to.equal('builtin')

    const scopedContext = testContext({ 'import/core-modules': ['@org/foobar'] })
    expect(importType('@org/foobar', scopedContext)).to.equal('builtin')
  })

  it("should return 'builtin' for resources inside additional core modules", function() {
    const electronContext = testContext({ 'import/core-modules': ['electron'] })
    expect(importType('electron/some/path/to/resource.json', electronContext)).to.equal('builtin')

    const scopedContext = testContext({ 'import/core-modules': ['@org/foobar'] })
    expect(importType('@org/foobar/some/path/to/resource.json', scopedContext)).to.equal('builtin')
  })

  it("should return 'external' for module from 'node_modules' with default config", function() {
    expect(importType('resolve', context)).to.equal('external')
  })

  it("should return 'internal' for module from 'node_modules' if 'node_modules' missed in 'external-module-folders'", function() {
    const foldersContext = testContext({ 'import/external-module-folders': [] })
    expect(importType('resolve', foldersContext)).to.equal('internal')
  })

  it("should return 'internal' for module from 'node_modules' if its name matched 'internal-regex'", function() {
    const foldersContext = testContext({ 'import/internal-regex': '^@org' })
    expect(importType('@org/foobar', foldersContext)).to.equal('internal')
  })

  it("should return 'external' for module from 'node_modules' if its name did not match 'internal-regex'", function() {
    const foldersContext = testContext({ 'import/internal-regex': '^@bar' })
    expect(importType('@org/foobar', foldersContext)).to.equal('external')
  })

  it("should return 'external' for module from 'node_modules' if 'node_modules' contained in 'external-module-folders'", function() {
    const foldersContext = testContext({ 'import/external-module-folders': ['node_modules'] })
    expect(importType('resolve', foldersContext)).to.equal('external')
  })

  it('returns "external" for a scoped symlinked module', function() {
    const foldersContext = testContext({
      'import/resolver': 'node',
      'import/external-module-folders': ['node_modules'],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('external')
  })

  // We're using Webpack resolver here since it resolves all symlinks, which means that
  // directory path will not contain node_modules/<package-name> but will point to the
  // actual directory inside 'files' instead
  it('returns "external" for a scoped module from a symlinked directory which name is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['symlinked-module'],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('external')
  })

  it('returns "internal" for a scoped module from a symlinked directory which incomplete name is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext_1 = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['symlinked-mod'],
    })
    expect(importType('@test-scope/some-module', foldersContext_1)).to.equal('internal')

    const foldersContext_2 = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['linked-module'],
    })
    expect(importType('@test-scope/some-module', foldersContext_2)).to.equal('internal')
  })

  it('returns "external" for a scoped module from a symlinked directory which partial path is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['files/symlinked-module'],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('external')
  })

  it('returns "internal" for a scoped module from a symlinked directory which partial path w/ incomplete segment is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext_1 = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['files/symlinked-mod'],
    })
    expect(importType('@test-scope/some-module', foldersContext_1)).to.equal('internal')

    const foldersContext_2 = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['les/symlinked-module'],
    })
    expect(importType('@test-scope/some-module', foldersContext_2)).to.equal('internal')
  })

  it('returns "external" for a scoped module from a symlinked directory which partial path ending w/ slash is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['files/symlinked-module/'],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('external')
  })

  it('returns "internal" for a scoped module from a symlinked directory when "external-module-folders" contains an absolute path resembling directory‘s relative path (webpack resolver)', function() {
    const foldersContext = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': ['/files/symlinked-module'],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('internal')
  })

  it('returns "external" for a scoped module from a symlinked directory which absolute path is contained in "external-module-folders" (webpack resolver)', function() {
    const foldersContext = testContext({
      'import/resolver': 'webpack',
      'import/external-module-folders': [testFilePath('symlinked-module')],
    })
    expect(importType('@test-scope/some-module', foldersContext)).to.equal('external')
  })
})
