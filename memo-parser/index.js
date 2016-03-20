"use strict"

const crypto = require('crypto')
    , moduleRequire = require('../lib/core/module-require')

const cache = new Map()

// must match ESLint default options or we'll miss the cache every time
const parserOptions = {
  loc: true,
  range: true,
  raw: true,
  tokens: true,
  comment: true,
  attachComment: true,
}

function hashObject(hash, options) {
  hash.update("{")
  Object.keys(options).sort().forEach(key => {
    hash.update(JSON.stringify(key))
    hash.update(':')
    const value = options[key]
    if (value instanceof Object) {
      hashObject(hash, value)
    } else {
      hash.update(JSON.stringify(value))
    }
    hash.update(",")
  })
  hash.update("}")
}

exports.parse = function parse(content, options) {
  // them defaults yo
  options = Object.assign({}, options, parserOptions)

  const keyHash = crypto.createHash('sha256')
  keyHash.update(content)
  hashObject(keyHash, options)

  const key = keyHash.digest('hex')

  let ast = cache.get(key)
  if (ast != null) return ast

  const realParser = moduleRequire.default(options.parser)

  ast = realParser.parse(content, options)
  cache.set(key, ast)

  return ast
}
