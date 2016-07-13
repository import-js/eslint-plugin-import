import { expect } from 'chai'

import resolve, { CASE_SENSITIVE_FS } from 'core/resolve'

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

  it('should test case sensitivity', function () {
    // Note the spelling error 'MyUncoolComponent' vs 'MyUnCoolComponent'
    var file = resolve( './jsx/MyUncoolComponent'
                      , utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] }})
                      )

    expect(file, 'path to ./jsx/MyUncoolComponent').to.be.undefined
  })

  describe('case cache correctness', function () {
    const context = utils.testContext({
      'import/cache': { 'lifetime': 1 },
    })

    const pairs = [
      ['./CaseyKasem.js', './CASEYKASEM.js'],
    ]

    pairs.forEach(([original, changed]) => {
      describe(`${original} => ${changed}`, function () {

        before('sanity check', function () {
          expect(resolve(original, context)).to.exist
          expect(resolve(changed, context)).not.to.exist
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

        // these tests fail on a case-sensitive file system
        // because nonexistent files aren't cached
        if (!CASE_SENSITIVE_FS) {
          it('gets cached values within cache lifetime', function () {
            // get cached values initially
            expect(resolve(original, context)).to.exist
            expect(resolve(changed, context)).not.to.exist
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
                expect(resolve(original, infiniteContext)).to.exist
                expect(resolve(changed, infiniteContext)).not.to.exist
              })
            })
          })
        }

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
