import { expect } from  'chai'
import ExportMap from '../../../lib/core/getExports'

import * as fs from 'fs'

import { getFilename } from '../utils'

describe('getExports', function () {
  const fakeContext = {
    getFilename: getFilename,
    settings: {},
    parserPath: 'babel-eslint',
  }

  it('should handle ExportAllDeclaration', function () {
    var imports
    expect(function () {
      imports = ExportMap.get('./export-all', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('foo')).to.be.true

  })

  it('should return a cached copy on subsequent requests', function () {
    expect(ExportMap.get('./named-exports', fakeContext))
      .to.exist.and.equal(ExportMap.get('./named-exports', fakeContext))
  })

  it('should not return a cached copy after modification', (done) => {
    const firstAccess = ExportMap.get('./mutator', fakeContext)
    expect(firstAccess).to.exist

    // mutate (update modified time)
    const newDate = new Date()
    fs.utimes(getFilename('mutator.js'), newDate, newDate, (error) => {
      expect(error).not.to.exist
      expect(ExportMap.get('./mutator', fakeContext)).not.to.equal(firstAccess)
      done()
    })
  })

  it('should not return a cached copy with different settings', () => {
    const firstAccess = ExportMap.get('./named-exports', fakeContext)
    expect(firstAccess).to.exist

    const differentSettings = Object.assign(
      {},
      fakeContext,
      { settings: { 'import/parser': 'babel-eslint' } })

    expect(ExportMap.get('./named-exports', differentSettings))
      .to.exist.and
      .not.to.equal(firstAccess)
  })

  it('should not throw for a missing file', function () {
    var imports
    expect(function () {
      imports = ExportMap.get('./does-not-exist', fakeContext)
    }).not.to.throw(Error)

    expect(imports).not.to.exist

  })

  it('should export explicit names for a missing file in exports', function () {
    var imports
    expect(function () {
      imports = ExportMap.get('./exports-missing', fakeContext)
    }).not.to.throw(Error)

    expect(imports).to.exist
    expect(imports.named.has('bar')).to.be.true

  })

  it('finds exports for an ES7 module with babel-eslint', function () {
    var imports = ExportMap.parse(
      getFilename('jsx/FooES7.js'),
      { parserPath: 'babel-eslint' }
    )

    expect(imports).to.exist
    expect(imports).to.have.property('hasDefault', true)
    expect(imports.named.has('Bar')).to.be.true
  })

  // it('finds exports for an ES7 module with proper parse options', function () {
  //   var imports = ExportMap.parse(
  //     getFilename('jsx/FooES7.js'),
  //     {
  //       parserPath: 'espree',
  //       parserOptions: {
  //         ecmaVersion: 7,
  //         ecmaFeatures: { jsx: true },
  //       },
  //     }
  //   )

  //   expect(imports).to.exist
  //   expect(imports.errors).to.be.empty
  //   expect(imports).to.have.property('hasDefault', true)
  //   expect(imports.named.has('Bar')).to.be.true
  // })

})
