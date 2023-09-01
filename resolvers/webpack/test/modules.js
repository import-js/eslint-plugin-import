'use strict';

const { expect } =  require('chai');
const path = require('path');

const { resolve } = require('../index');

const file = path.join(__dirname, 'files', 'dummy.js');

describe('resolve.moduleDirectories', function () {

  it('finds a node module', function () {
    expect(resolve('some-module', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'node_modules', 'some-module', 'index.js'));
  });

  it('finds a bower module', function () {
    expect(resolve('typeahead.js', file)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'bower_components', 'typeahead.js'));
  });

});
