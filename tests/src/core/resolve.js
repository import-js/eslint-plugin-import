import { expect } from 'chai'

import resolve from 'core/resolve'

import * as fs from 'fs'
import * as utils from '../utils'

describe('resolve', function () {
  it('should throw on bad parameters.', function () {
    expect(resolve.bind(null, null, null)).to.throw(Error)
  })

  it('respects import/resolve extensions', function () {
    var file = resolve( './jsx/MyCoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file).to.equal(utils.testFilePath('./jsx/MyCoolComponent.jsx'))
  })

  it('should test case sensitivity', function () {
    // Note the spelling error 'MyUncoolComponent' vs 'MyUnCoolComponent'
    var file = resolve( './jsx/MyUncoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file, 'path to ./jsx/MyUncoolComponent').to.be.undefined
  })

  describe('cache correctness', function () {
    const context = utils.testContext({
      'import/cache': { 'lifetime': 1 },
    })

    const originalCase = './CaseyKasem.js'
        , changedCase = './CASEYKASEM.js'

    before(function (done) {
      expect(resolve(originalCase, context)).to.exist
      expect(resolve(changedCase, context)).not.to.exist

      fs.rename(
        utils.testFilePath(originalCase),
        utils.testFilePath(changedCase),
        done)
    })

    it('gets cached values within cache lifetime', function () {
      // get cached values initially
      expect(resolve(originalCase, context)).to.exist
      expect(resolve(changedCase, context)).not.to.exist
    })

    // special behavior for infinity
    describe('infinite cache', function () {
      this.timeout(1200)
      before((done) => setTimeout(done, 1100))

      const lifetimes = [ '∞', 'Infinity' ]
      lifetimes.forEach(inf => {
        const infiniteContext =  utils.testContext({
          'import/cache': { 'lifetime': inf },
        })

        it(`lifetime: ${inf} still gets cached values after ~1s`, function () {
          expect(resolve(originalCase, infiniteContext)).to.exist
          expect(resolve(changedCase, infiniteContext)).not.to.exist
        })
      })
    })

    describe('finite cache', function () {
      this.timeout(1200)
      before((done) => setTimeout(done, 1000))
      it('gets correct values after cache lifetime', function () {
        expect(resolve(originalCase, context)).not.to.exist
        expect(resolve(changedCase, context)).to.exist
      })
    })

    after('restore original case', function (done) {
      fs.rename(
        utils.testFilePath(changedCase),
        utils.testFilePath(originalCase),
        done)
    })
  })

})
