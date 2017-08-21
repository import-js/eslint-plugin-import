import { expect } from 'chai'

import hashify, { hashArray, hashObject } from 'eslint-module-utils/hash'

const createHash = require('crypto').createHash

function expectHash(actualHash, expectedString) {
  const expectedHash = createHash('sha256')
  expectedHash.update(expectedString)
  expect(actualHash.digest('hex'), 'to be a hex digest of sha256 hash of string <' + expectedString + '>').to.equal(expectedHash.digest('hex'))
}

describe('hash', function () {
  describe('hashify', function () {
    it('handles null', function () {
      expectHash(hashify(null), 'null')
    })

    it('handles undefined', function () {
      expectHash(hashify(undefined), 'undefined')
    })

    it('handles numbers', function () {
      expectHash(hashify(123.456), '123.456')
    })

    it('handles strings', function () {
      expectHash(hashify('a string'), '"a string"')
    })

    it('handles Array instances', function () {
      expectHash(hashify([ 'a string' ]), '["a string",]')
    })

    it('handles empty Array instances', function () {
      expectHash(hashify([]), '[]')
    })

    it('handles Object instances', function () {
      expectHash(hashify({ foo: 123.456, 'a key': 'a value' }), '{"a key":"a value","foo":123.456,}')
    })

    it('handles nested Object instances', function () {
      expectHash(hashify({ foo: 123.456, 'a key': 'a value', obj: { abc: { def: 'ghi' } } }), '{"a key":"a value","foo":123.456,"obj":{"abc":{"def":"ghi",},},}')
    })

    it('handles nested Object and Array instances', function () {
      expectHash(hashify({ foo: 123.456, 'a key': 'a value', obj: { arr: [ { def: 'ghi' } ] } }), '{"a key":"a value","foo":123.456,"obj":{"arr":[{"def":"ghi",},],},}')
    })
  })

  describe('hashArray', function () {
    it('handles Array instances', function () {
      expectHash(hashArray([ 'a string' ]), '["a string",]')
    })

    it('handles empty Array instances', function () {
      expectHash(hashArray([]), '[]')
    })
  })

  describe('hashObject', function () {
    it('handles Object instances', function () {
      expectHash(hashObject({ foo: 123.456, 'a key': 'a value' }), '{"a key":"a value","foo":123.456,}')
    })

    it('handles nested Object instances', function () {
      expectHash(hashObject({ foo: 123.456, 'a key': 'a value', obj: { abc: { def: 'ghi' } } }), '{"a key":"a value","foo":123.456,"obj":{"abc":{"def":"ghi",},},}')
    })

    it('handles nested Object and Array instances', function () {
      expectHash(hashObject({ foo: 123.456, 'a key': 'a value', obj: { arr: [ { def: 'ghi' } ] } }), '{"a key":"a value","foo":123.456,"obj":{"arr":[{"def":"ghi",},],},}')
    })
  })

})
