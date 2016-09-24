import { expect } from 'chai'

import resolve, { CASE_SENSITIVE_FS, fileExistsWithCaseSync } from 'eslint-module-utils/resolve'
import ModuleCache from 'eslint-module-utils/ModuleCache'

import * as fs from 'fs'
import * as utils from '../utils'

describe('resolve', function () {
  it('should throw on bad parameters.', function () {
    expect(resolve.bind(null, null, null)).to.throw(Error)
  })

  it('loads a custom resolver path', function () {
    var file = resolve( '../files/foo'
                      , utils.testContext({ 'import/resolver': './foo-bar-resolver'})
                      )

    expect(file).to.equal(utils.testFilePath('./bar.jsx'))
  })

  it('respects import/resolve extensions', function () {
    var file = resolve( './jsx/MyCoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file).to.equal(utils.testFilePath('./jsx/MyCoolComponent.jsx'))
  })

  const caseDescribe = (!CASE_SENSITIVE_FS ? describe : describe.skip)
  caseDescribe('case sensitivity', function () {
    let file
    const testContext = utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
    before('resolve', function () {
      file = resolve(
      // Note the case difference 'MyUncoolComponent' vs 'MyUnCoolComponent'
        './jsx/MyUncoolComponent', testContext)
    })
    it('resolves regardless of case', function () {
      expect(file, 'path to ./jsx/MyUncoolComponent').to.exist
    })
    it('detects case does not match FS', function () {
      expect(fileExistsWithCaseSync(file, ModuleCache.getSettings(testContext)))
        .to.be.false
    })
  })

  describe('rename cache correctness', function () {
    const context = utils.testContext({
      'import/cache': { 'lifetime': 1 },
    })

    const infiniteContexts = [ '∞', 'Infinity' ].map(inf => [inf,
      utils.testContext({
        'import/cache': { 'lifetime': inf },
      })])


    const pairs = [
      ['./CaseyKasem.js', './CASEYKASEM2.js'],
    ]

    pairs.forEach(([original, changed]) => {
      describe(`${original} => ${changed}`, function () {

        before('sanity check', function () {
          expect(resolve(original, context)).to.exist
          expect(resolve(changed, context)).not.to.exist
        })

        // settings are part of cache key
        before('warm up infinite entries', function () {
          infiniteContexts.forEach(([,c]) => {
            expect(resolve(original, c)).to.exist
          })
        })

        before('rename', function (done) {
          fs.rename(
            utils.testFilePath(original),
            utils.testFilePath(changed),
            done)
        })

        before('verify rename', (done) =>
          fs.exists(
            utils.testFilePath(changed),
            exists => done(exists ? null : new Error('new file does not exist'))))

        it('gets cached values within cache lifetime', function () {
          // get cached values initially
          expect(resolve(original, context)).to.exist
        })

        it('gets updated values immediately', function () {
          // get cached values initially
          expect(resolve(changed, context)).to.exist
        })

        // special behavior for infinity
        describe('infinite cache', function () {
          this.timeout(1500)

          before((done) => setTimeout(done, 1100))

          infiniteContexts.forEach(([inf, infiniteContext]) => {
            it(`lifetime: ${inf} still gets cached values after ~1s`, function () {
              expect(resolve(original, infiniteContext), original).to.exist
            })
          })

        })

        describe('finite cache', function () {
          this.timeout(1200)
          before((done) => setTimeout(done, 1000))
          it('gets correct values after cache lifetime', function () {
            expect(resolve(original, context)).not.to.exist
            expect(resolve(changed, context)).to.exist
          })
        })

        after('restore original case', function (done) {
          fs.rename(
            utils.testFilePath(changed),
            utils.testFilePath(original),
            done)
        })
      })
    })
  })

})
