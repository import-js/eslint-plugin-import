var expect = require('chai').expect

var path = require('path')
  , fs = require('fs')

function isJSFile(f) {
  return path.extname(f) === '.js'
}

describe('package', function () {
  let pkg = path.join(process.cwd(), 'src')
    , module

  before('is importable', function () {
    module = require(pkg)
  })

  it('exists', function () {
    expect(module).to.exist
  })

  it('has every rule', function (done) {

    fs.readdir(
      path.join(pkg, 'rules')
    , function (err, files) {
        expect(err).not.to.exist

        files.filter(isJSFile).forEach(function (f) {
          expect(module.rules).to.have
            .property(path.basename(f, '.js'))
        })

        done()
      })
  })

  it('exports all configs', function (done) {
    fs.readdir(path.join(process.cwd(), 'config'), function (err, files) {
      if (err) { done(err); return }
      files.filter(isJSFile).forEach(file => {
        if (file[0] === '.') return
        expect(module.configs).to.have.property(path.basename(file, '.js'))
      })
      done()
    })
  })

  it('has configs only for rules that exist', function () {
    for (let configFile in module.configs) {
      let preamble = 'import/'

      for (let rule in module.configs[configFile].rules) {
        expect(() => require('rules/'+rule.slice(preamble.length)))
          .not.to.throw(Error)
      }
    }
  })

  it('marks deprecated rules in their metadata', function () {
    expect(module.rules['imports-first'].meta.deprecated).to.be.true
    expect(module.rules['first'].meta.deprecated).not.to.be.true
  })

})
