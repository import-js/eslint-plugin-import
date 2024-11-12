'use strict';

const chai =  require('chai');
const expect = chai.expect;
const path = require('path');

const resolve = require('../index').resolve;

const file = path.join(__dirname, 'files', 'src', 'jsx', 'dummy.js');

describe('cache', function () {
  it('can distinguish different config files', function () {
    const setting1 = {
      config: require(path.join(__dirname, './files/webpack.function.config.js')),
      argv: {
        mode: 'test',
      },
      cache: true,
    };
    expect(resolve('baz', file, setting1)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'bar', 'bar.js'));
    const setting2 = {
      config: require(path.join(__dirname, './files/webpack.function.config.multiple.js')),
      cache: true,
    };
    expect(resolve('baz', file, setting2)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'foo.js'));
  });

  it('can distinguish different config', function () {
    const setting1 = {
      config: require(path.join(__dirname, './files/webpack.function.config.js')),
      env: {
        dummy: true,
      },
      cache: true,
    };
    expect(resolve('bar', file, setting1)).to.have.property('path')
      .and.equal(path.join(__dirname, 'files', 'some', 'goofy', 'path', 'bar.js'));
    const setting2 = {
      config: require(path.join(__dirname, './files/webpack.function.config.multiple.js')),
      cache: true,
    };
    const result = resolve('bar', file, setting2);
    expect(result).not.to.have.property('path');
    expect(result).to.have.property('found').to.be.false;
  });
});
