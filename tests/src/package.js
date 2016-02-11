var expect = require('chai').expect

var path = require('path')
  , fs = require('fs')

describe('package', function () {
  let pkg

  before(function () {
    pkg = path.join(process.cwd(), 'lib')
  })

  it('is importable', function () {
    expect(require(pkg)).to.exist
  })

  it('has every rule', function (done) {
    var module = require(pkg)

    fs.readdir(
      path.join(pkg, 'rules')
    , function (err, files) {
        expect(err).not.to.exist

        files.forEach(function (f) {
          expect(module.rules).to.have
            .property(path.basename(f, '.js'))
        })

        done()
      })
  })

  it('has config for every rule', function (done) {
    var module = require(pkg)

    fs.readdir(
      path.join(pkg, 'rules')
    , function (err, files) {
        expect(err).not.to.exist

        files.forEach(function (f) {
          expect(module.rulesConfig).to.have
            .property(path.basename(f, '.js'))
        })

        done()
      })
  })
})

describe('shared configs', function () {
  it('has only rules that exist', function () {
    let preamble = 'import/'
    for (let configFile of ['index', 'warnings']) {
      for (let rule in require('../../config/'+configFile).rules) {
        expect(() => require('rules/'+rule.slice(preamble.length)))
          .not.to.throw(Error)
      }
    }
  })
})

