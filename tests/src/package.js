const expect = require('chai').expect;

const path = require('path');
const fs = require('fs');

function isJSFile(f) {
  return path.extname(f) === '.js';
}

describe('package', function () {
  const pkg = path.join(process.cwd(), 'src');
  let module;

  before('is importable', function () {
    module = require(pkg);
  });

  it('exists', function () {
    expect(module).to.exist;
  });

  it('has every rule', function (done) {
    fs.readdir(
      path.join(pkg, 'rules')
      , function (err, files) {
        expect(err).not.to.exist;

        files.filter(isJSFile).forEach(function (f) {
          expect(module.rules).to.have.property(path.basename(f, '.js'));
        });

        done();
      });
  });

  it('exports all legacy configs', function (done) {
    fs.readdir(path.join(process.cwd(), 'config'), function (err, files) {
      if (err) { done(err); return; }
      files.filter(isJSFile).forEach((file) => {
        if (file[0] === '.') { return; }
        expect(module.configs).to.have.property(path.basename(file, '.js'));
      });
      done();
    });
  });

  it('exports all flat configs', function (done) {
    fs.readdir(path.join(process.cwd(), 'config'), function (err, files) {
      if (err) { done(err); return; }
      files.filter(isJSFile).forEach((file) => {
        if (file[0] === '.') { return; }

        const basename = path.basename(file, '.js');
        // stage-0 is not included in flat configs
        if (basename === 'stage-0') { return; }

        expect(module.flatConfigs).to.have.property(basename);
      });
      done();
    });
  });

  it('exports plugin meta object', function () {
    expect(module.meta).to.be.an('object').that.has.all.keys('name', 'version');
    expect(module.meta.name).to.equal('eslint-plugin-import');
    expect(module.meta.version).to.be.a('string');
  });

  it('ensures the plugin object in the flat configs is identical to the module', function () {
    for (const configFile in module.flatConfigs) {
      expect(module.flatConfigs[configFile].plugins.import).to.equal(module);
    }
  });

  function getRulePath(ruleName) {
    // 'require' does not work with dynamic paths because of the compilation step by babel
    // (which resolves paths according to the root folder configuration)
    // the usage of require.resolve on a static path gets around this
    return path.resolve(require.resolve('rules/no-unresolved'), '..', ruleName);
  }

  it('has configs only for rules that exist', function () {
    for (const configFile in module.configs) {
      const preamble = 'import/';

      for (const rule in module.configs[configFile].rules) {
        expect(() => require(getRulePath(rule.slice(preamble.length))))
          .not.to.throw(Error);
      }
    }
  });

  it('marks deprecated rules in their metadata', function () {
    expect(module.rules['imports-first'].meta.deprecated).to.be.true;
    expect(module.rules.first.meta.deprecated).not.to.be.true;
  });

});
