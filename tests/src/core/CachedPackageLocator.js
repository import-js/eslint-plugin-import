import fs from 'fs'
import sinon from 'sinon'
import { expect } from 'chai'

import CachedPackageLocator from '../../../src/core/CachedPackageLocator'

function notEmpty(obj) {
  return Object.keys(obj).length
}

function reduce({
  dependencies = {},
  devDependencies = {},
  peerDependencies = {},
  optionalDependencies = {},
} = {}) {
  if ([dependencies, devDependencies, peerDependencies, optionalDependencies].some(notEmpty)) {
    return { dependencies, devDependencies, peerDependencies, optionalDependencies }
  }

  return null
}

describe('CachedPackageLocator.readUpSync()', function () {
  let sandbox
  let packageLocator

  const withUnexpectedTokenStr = '{{"name":"foo"}'
  const withUnexpectedEndStr = '{"name":"foo"'
  const withDeps = {
    dependencies: { 'prop-types': '~15.0.0' },
    devDependencies: { 'webpack': '^2.0.0' },
    peerDependencies: { 'react': '>=15.0.0' },
    optionalDependencies: { 'fs-events': '*' },
  }
  const withDepsStr = JSON.stringify(withDeps)
  const withDepsExtraFieldsStr = JSON.stringify(
    Object.assign({}, withDeps, {
      name: 'not-needed',
      description: 'foo bar',
    })
  )
  const context = {
    report: sinon.spy(),
  }

  before(function () {
    sandbox = sinon.sandbox.create()
    sandbox.stub(fs, 'readFileSync').reset()
  })

  after(function () {
    sandbox.restore()
  })

  beforeEach(function () {
    fs.readFileSync.throws({ code: 'ENOENT' })
    packageLocator = new CachedPackageLocator()
  })

  afterEach(function () {
    context.report.reset()
    sandbox.reset()
  })

  it('should not repeat fs.readFileSync on stored locations', function () {
    fs.readFileSync.withArgs('/a/package.json').returns(withDepsStr)

    expect(packageLocator.readUpSync(context, '/a/b', false, reduce))
      .to.deep.equal(withDeps)
    sinon.assert.callCount(fs.readFileSync, 2)
    expect(packageLocator.readUpSync(context, '/a', false, reduce))
      .to.deep.equal(withDeps)
    sinon.assert.callCount(fs.readFileSync, 2)
    expect(packageLocator.store).to.deep.equal({
      '/a/b/package.json': null,
      '/a/package.json': withDeps,
    })

    expect(packageLocator.readUpSync(context, '/x', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 4)
    expect(packageLocator.readUpSync(context, '/x', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 4)
    expect(packageLocator.store).to.deep.equal({
      '/x/package.json': null,
      '/a/b/package.json': null,
      '/a/package.json': withDeps,
      '/package.json': null,
    })

    expect(packageLocator.readUpSync(context, '/x/y/z', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 6)
    expect(packageLocator.readUpSync(context, '/x/y/z', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 6)
    expect(packageLocator.store).to.deep.equal({
      '/x/y/z/package.json': null,
      '/x/y/package.json': null,
      '/x/package.json': null,
      '/a/b/package.json': null,
      '/a/package.json': withDeps,
      '/package.json': null,
    })

    expect(packageLocator.readUpSync(context, '/x/w', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 7)
    expect(packageLocator.readUpSync(context, '/x/w', false, reduce)).to.be.undefined
    sinon.assert.callCount(fs.readFileSync, 7)

    expect(packageLocator.store).to.deep.equal({
      '/x/y/z/package.json': null,
      '/x/y/package.json': null,
      '/x/w/package.json': null,
      '/x/package.json': null,
      '/a/b/package.json': null,
      '/a/package.json': withDeps,
      '/package.json': null,
    })
  })

  it('should only store and return dependency fields', function () {
    fs.readFileSync.withArgs('/package.json').returns(withDepsExtraFieldsStr)
    expect(packageLocator.readUpSync(context, '/', false, reduce))
      .to.deep.equal(withDeps)
    expect(packageLocator.store).to.deep.equal({
      '/package.json': withDeps,
    })
    sinon.assert.calledOnce(fs.readFileSync)
  })

  it('should locate first available', function () {
    fs.readFileSync.withArgs('/a/b/package.json').returns(withDepsStr)
    expect(packageLocator.readUpSync(context, '/a/b', false, reduce))
      .to.deep.equal(withDeps)
    expect(packageLocator.store).to.deep.equal({
      '/a/b/package.json': withDeps,
    })
    sinon.assert.notCalled(context.report)
  })

  it('should locate last available', function () {
    fs.readFileSync.withArgs('/package.json').returns(withDepsStr)
    expect(packageLocator.readUpSync(context, '/a/b/c/d/e/f', false, reduce))
      .to.deep.equal(withDeps)
    expect(packageLocator.store).to.deep.equal({
      '/a/b/c/d/e/f/package.json': null,
      '/a/b/c/d/e/package.json': null,
      '/a/b/c/d/package.json': null,
      '/a/b/c/package.json': null,
      '/a/b/package.json': null,
      '/a/package.json': null,
      '/package.json': withDeps,
    })
    sinon.assert.notCalled(context.report)
  })

  it('should store package.json with empty deps as null', function () {
    fs.readFileSync.withArgs('/package.json').returns('{}')
    expect(packageLocator.readUpSync(context, '/', false, reduce))
      .to.be.undefined
    expect(packageLocator.store).to.deep.equal({
      '/package.json': null,
    })
    sinon.assert.calledOnce(context.report)
  })

  it('should not store JSON.parse failures', function () {
    fs.readFileSync
      .withArgs('/package.json').returns(withDepsStr)
      .withArgs('/a/package.json').returns(withUnexpectedTokenStr)
      .withArgs('/a/b/package.json').returns(withUnexpectedEndStr)
    expect(packageLocator.readUpSync(context, '/a', false))
      .to.be.undefined
    expect(packageLocator.store).to.be.empty
    expect(packageLocator.readUpSync(context, '/a/b/c/d', false))
      .to.be.undefined
    expect(packageLocator.store).to.deep.equal({
      '/a/b/c/d/package.json': null,
      '/a/b/c/package.json': null,
    })
    sinon.assert.callCount(context.report, 2)
  })

  it('should store failed locations as null', function () {
    expect(packageLocator.readUpSync(context, '/does/not/exist', false))
      .to.be.undefined
    expect(packageLocator.store).to.deep.equal({
      '/does/not/exist/package.json': null,
      '/does/not/package.json': null,
      '/does/package.json': null,
      '/package.json': null,
    })
    sinon.assert.calledOnce(context.report)
  })

  it('immediate=true should halt on first failed location', function () {
    expect(packageLocator.readUpSync(context, '/does/not/exist', true))
      .to.be.undefined
    expect(packageLocator.store).to.deep.equal({
      '/does/not/exist/package.json': null
    })
    sinon.assert.calledOnce(context.report)
  })

  it('should throw unknown errors', function () {
    fs.readFileSync.throws(new Error('Some unknown error'))
    expect(() => {
      packageLocator.readUpSync(context, '/does/not/exist', true)
    }).to.throw('Some unknown error')
    expect(packageLocator.store).to.empty
    sinon.assert.notCalled(context.report)
  })
})
