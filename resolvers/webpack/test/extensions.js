'use strict';

const chai =  require('chai');
const expect = chai.expect;
const path = require('path');

const resolve = require('../index').resolve;


const file = path.join(__dirname, 'files', 'dummy.js');
const extensions = path.join(__dirname, 'custom-extensions', 'dummy.js');

describe('extensions', function () {
  it('respects the defaults', function () {
    expect(resolve('./foo', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'foo.web.js'));
  });

  describe('resolve.extensions set', function () {
    it('works', function () {
      expect(resolve('./foo', extensions)).to.have.property('path')
        .and.equal(path.join(__dirname, 'custom-extensions', 'foo.js'));
    });

    it('replaces defaults', function () {
      expect(resolve('./baz', extensions)).to.have.property('found', false);
    });

    it('finds .coffee', function () {
      expect(resolve('./bar', extensions)).to.have.property('path')
        .and.equal(path.join(__dirname, 'custom-extensions', 'bar.coffee'));
    });
  });
});
