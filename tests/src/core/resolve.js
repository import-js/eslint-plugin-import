import { expect } from 'chai';
import eslintPkg from 'eslint/package.json';
import semver from 'semver';

import resolve, { CASE_SENSITIVE_FS, fileExistsWithCaseSync } from 'eslint-module-utils/resolve';

import * as path from 'path';
import * as fs from 'fs';
import * as utils from '../utils';

describe('resolve', function () {
  // We don't want to test for a specific stack, just that it was there in the error message.
  function replaceErrorStackForTest(str) {
    return typeof str === 'string' ? str.replace(/(\n\s+at .+:\d+\)?)+$/, '\n<stack-was-here>') : str;
  }

  it('throws on bad parameters', function () {
    expect(resolve.bind(null, null, null)).to.throw(Error);
  });

  it('resolves via a custom resolver with interface version 1', function () {
    const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-v1' });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));

    expect(resolve( '../files/exception'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('exception.js'); } }),
    )).to.equal(undefined);

    expect(resolve( '../files/not-found'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('not-found.js'); } }),
    )).to.equal(undefined);
  });

  it('resolves via a custom resolver with interface version 1 assumed if not specified', function () {
    const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-no-version' });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));

    expect(resolve( '../files/exception'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('exception.js'); } }),
    )).to.equal(undefined);

    expect(resolve( '../files/not-found'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('not-found.js'); } }),
    )).to.equal(undefined);
  });

  it('resolves via a custom resolver with interface version 2', function () {
    const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-v2' });
    const testContextReports = [];
    testContext.report = function (reportInfo) {
      testContextReports.push(reportInfo);
    };

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));

    testContextReports.length = 0;
    expect(resolve( '../files/exception'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('exception.js'); } }),
    )).to.equal(undefined);
    expect(testContextReports[0]).to.be.an('object');
    expect(replaceErrorStackForTest(testContextReports[0].message)).to.equal('Resolve error: foo-bar-resolver-v2 resolve test exception\n<stack-was-here>');
    expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });

    testContextReports.length = 0;
    expect(resolve( '../files/not-found'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('not-found.js'); } }),
    )).to.equal(undefined);
    expect(testContextReports.length).to.equal(0);
  });

  it('respects import/resolver as array of strings', function () {
    const testContext = utils.testContext({ 'import/resolver': [ './foo-bar-resolver-v2', './foo-bar-resolver-v1' ] });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));
  });

  it('respects import/resolver as object', function () {
    const testContext = utils.testContext({ 'import/resolver': { './foo-bar-resolver-v2': {} } });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));
  });

  it('respects import/resolver as array of objects', function () {
    const testContext = utils.testContext({ 'import/resolver': [ { './foo-bar-resolver-v2': {} }, { './foo-bar-resolver-v1': {} } ] });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));
  });

  it('finds resolvers from the source files rather than eslint-module-utils', function () {
    const testContext = utils.testContext({ 'import/resolver': { 'foo': {} } });

    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(utils.testFilePath('./bar.jsx'));
  });

  it('reports invalid import/resolver config', function () {
    const testContext = utils.testContext({ 'import/resolver': 123.456 });
    const testContextReports = [];
    testContext.report = function (reportInfo) {
      testContextReports.push(reportInfo);
    };

    testContextReports.length = 0;
    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(undefined);
    expect(testContextReports[0]).to.be.an('object');
    expect(testContextReports[0].message).to.equal('Resolve error: invalid resolver config');
    expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
  });

  it('reports loaded resolver with invalid interface', function () {
    const resolverName = './foo-bar-resolver-invalid';
    const testContext = utils.testContext({ 'import/resolver': resolverName });
    const testContextReports = [];
    testContext.report = function (reportInfo) {
      testContextReports.push(reportInfo);
    };
    testContextReports.length = 0;
    expect(resolve( '../files/foo'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('foo.js'); } }),
    )).to.equal(undefined);
    expect(testContextReports[0]).to.be.an('object');
    expect(testContextReports[0].message).to.equal(`Resolve error: ${resolverName} with invalid interface loaded as resolver`);
    expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
  });

  it('respects import/resolve extensions', function () {
    const testContext = utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] } });

    expect(resolve( './jsx/MyCoolComponent'
      , testContext,
    )).to.equal(utils.testFilePath('./jsx/MyCoolComponent.jsx'));
  });

  it('reports load exception in a user resolver', function () {
    const testContext = utils.testContext({ 'import/resolver': './load-error-resolver' });
    const testContextReports = [];
    testContext.report = function (reportInfo) {
      testContextReports.push(reportInfo);
    };

    expect(resolve( '../files/exception'
      , Object.assign({}, testContext, { getFilename() { return utils.getFilename('exception.js'); } }),
    )).to.equal(undefined);
    expect(testContextReports[0]).to.be.an('object');
    expect(replaceErrorStackForTest(testContextReports[0].message)).to.equal('Resolve error: SyntaxError: TEST SYNTAX ERROR\n<stack-was-here>');
    expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
  });

  // context.getPhysicalFilename() is available in ESLint 7.28+
  (semver.satisfies(eslintPkg.version, '>= 7.28') ? describe : describe.skip)('getPhysicalFilename()', () => {
    function unexpectedCallToGetFilename() {
      throw new Error('Expected to call to getPhysicalFilename() instead of getFilename()');
    }

    it('resolves via a custom resolver with interface version 1', function () {
      const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-v1' });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));

      expect(resolve( '../files/exception'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('exception.js'); } }),
      )).to.equal(undefined);

      expect(resolve( '../files/not-found'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('not-found.js'); } }),
      )).to.equal(undefined);
    });

    it('resolves via a custom resolver with interface version 1 assumed if not specified', function () {
      const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-no-version' });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));

      expect(resolve( '../files/exception'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('exception.js'); } }),
      )).to.equal(undefined);

      expect(resolve( '../files/not-found'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('not-found.js'); } }),
      )).to.equal(undefined);
    });

    it('resolves via a custom resolver with interface version 2', function () {
      const testContext = utils.testContext({ 'import/resolver': './foo-bar-resolver-v2' });
      const testContextReports = [];
      testContext.report = function (reportInfo) {
        testContextReports.push(reportInfo);
      };

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));

      testContextReports.length = 0;
      expect(resolve( '../files/exception'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('exception.js'); } }),
      )).to.equal(undefined);
      expect(testContextReports[0]).to.be.an('object');
      expect(replaceErrorStackForTest(testContextReports[0].message)).to.equal('Resolve error: foo-bar-resolver-v2 resolve test exception\n<stack-was-here>');
      expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });

      testContextReports.length = 0;
      expect(resolve( '../files/not-found'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('not-found.js'); } }),
      )).to.equal(undefined);
      expect(testContextReports.length).to.equal(0);
    });

    it('respects import/resolver as array of strings', function () {
      const testContext = utils.testContext({ 'import/resolver': [ './foo-bar-resolver-v2', './foo-bar-resolver-v1' ] });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));
    });

    it('respects import/resolver as object', function () {
      const testContext = utils.testContext({ 'import/resolver': { './foo-bar-resolver-v2': {} } });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));
    });

    it('respects import/resolver as array of objects', function () {
      const testContext = utils.testContext({ 'import/resolver': [ { './foo-bar-resolver-v2': {} }, { './foo-bar-resolver-v1': {} } ] });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));
    });

    it('finds resolvers from the source files rather than eslint-module-utils', function () {
      const testContext = utils.testContext({ 'import/resolver': { 'foo': {} } });

      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(utils.testFilePath('./bar.jsx'));
    });

    it('reports invalid import/resolver config', function () {
      const testContext = utils.testContext({ 'import/resolver': 123.456 });
      const testContextReports = [];
      testContext.report = function (reportInfo) {
        testContextReports.push(reportInfo);
      };

      testContextReports.length = 0;
      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(undefined);
      expect(testContextReports[0]).to.be.an('object');
      expect(testContextReports[0].message).to.equal('Resolve error: invalid resolver config');
      expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
    });

    it('reports loaded resolver with invalid interface', function () {
      const resolverName = './foo-bar-resolver-invalid';
      const testContext = utils.testContext({ 'import/resolver': resolverName });
      const testContextReports = [];
      testContext.report = function (reportInfo) {
        testContextReports.push(reportInfo);
      };
      testContextReports.length = 0;
      expect(resolve( '../files/foo'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('foo.js'); } }),
      )).to.equal(undefined);
      expect(testContextReports[0]).to.be.an('object');
      expect(testContextReports[0].message).to.equal(`Resolve error: ${resolverName} with invalid interface loaded as resolver`);
      expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
    });

    it('respects import/resolve extensions', function () {
      const testContext = utils.testContext({ 'import/resolve': { 'extensions': ['.jsx'] } });

      expect(resolve( './jsx/MyCoolComponent'
        , testContext,
      )).to.equal(utils.testFilePath('./jsx/MyCoolComponent.jsx'));
    });

    it('reports load exception in a user resolver', function () {
      const testContext = utils.testContext({ 'import/resolver': './load-error-resolver' });
      const testContextReports = [];
      testContext.report = function (reportInfo) {
        testContextReports.push(reportInfo);
      };

      expect(resolve( '../files/exception'
        , Object.assign({}, testContext, { getFilename: unexpectedCallToGetFilename, getPhysicalFilename() { return utils.getFilename('exception.js'); } }),
      )).to.equal(undefined);
      expect(testContextReports[0]).to.be.an('object');
      expect(replaceErrorStackForTest(testContextReports[0].message)).to.equal('Resolve error: SyntaxError: TEST SYNTAX ERROR\n<stack-was-here>');
      expect(testContextReports[0].loc).to.eql({ line: 1, column: 0 });
    });
  });

  const caseDescribe = (!CASE_SENSITIVE_FS ? describe : describe.skip);
  caseDescribe('case sensitivity', function () {
    let file;
    const testContext = utils.testContext({
      'import/resolve': { 'extensions': ['.jsx'] },
      'import/cache': { lifetime: 0 },
    });
    const testSettings = testContext.settings;
    before('resolve', function () {
      file = resolve(
      // Note the case difference 'MyUncoolComponent' vs 'MyUnCoolComponent'
        './jsx/MyUncoolComponent', testContext);
    });
    it('resolves regardless of case', function () {
      expect(file, 'path to ./jsx/MyUncoolComponent').to.exist;
    });
    it('detects case does not match FS', function () {
      expect(fileExistsWithCaseSync(file, testSettings))
        .to.be.false;
    });
    it('detecting case does not include parent folder path (issue #720)', function () {
      const f = path.join(process.cwd().toUpperCase(), './tests/files/jsx/MyUnCoolComponent.jsx');
      expect(fileExistsWithCaseSync(f, testSettings))
        .to.be.true;
    });
    it('detecting case should include parent folder path', function () {
      const f = path.join(process.cwd().toUpperCase(), './tests/files/jsx/MyUnCoolComponent.jsx');
      expect(fileExistsWithCaseSync(f, testSettings, true))
        .to.be.false;
    });
  });

  describe('rename cache correctness', function () {
    const context = utils.testContext({
      'import/cache': { 'lifetime': 1 },
    });

    const infiniteContexts = [ '∞', 'Infinity' ].map(inf => [inf,
      utils.testContext({
        'import/cache': { 'lifetime': inf },
      })]);


    const pairs = [
      ['./CaseyKasem.js', './CASEYKASEM2.js'],
    ];

    pairs.forEach(([original, changed]) => {
      describe(`${original} => ${changed}`, function () {

        before('sanity check', function () {
          expect(resolve(original, context)).to.exist;
          expect(resolve(changed, context)).not.to.exist;
        });

        // settings are part of cache key
        before('warm up infinite entries', function () {
          infiniteContexts.forEach(([,c]) => {
            expect(resolve(original, c)).to.exist;
          });
        });

        before('rename', function (done) {
          fs.rename(
            utils.testFilePath(original),
            utils.testFilePath(changed),
            done);
        });

        before('verify rename', (done) =>
          fs.exists(
            utils.testFilePath(changed),
            exists => done(exists ? null : new Error('new file does not exist'))));

        it('gets cached values within cache lifetime', function () {
          // get cached values initially
          expect(resolve(original, context)).to.exist;
        });

        it('gets updated values immediately', function () {
          // get cached values initially
          expect(resolve(changed, context)).to.exist;
        });

        // special behavior for infinity
        describe('infinite cache', function () {
          this.timeout(1500);

          before((done) => setTimeout(done, 1100));

          infiniteContexts.forEach(([inf, infiniteContext]) => {
            it(`lifetime: ${inf} still gets cached values after ~1s`, function () {
              expect(resolve(original, infiniteContext), original).to.exist;
            });
          });

        });

        describe('finite cache', function () {
          this.timeout(1200);
          before((done) => setTimeout(done, 1000));
          it('gets correct values after cache lifetime', function () {
            expect(resolve(original, context)).not.to.exist;
            expect(resolve(changed, context)).to.exist;
          });
        });

        after('restore original case', function (done) {
          fs.rename(
            utils.testFilePath(changed),
            utils.testFilePath(original),
            done);
        });
      });
    });
  });

});
