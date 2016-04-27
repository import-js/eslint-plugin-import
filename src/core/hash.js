/**
 * utilities for hashing config objects.
 * basically iteratively updates hash with a JSON-like format
 */

const stringify = JSON.stringify

export default function hashify(hash, value) {
  if (value instanceof Array) {
    hashArray(hash, value)
  } else if (value instanceof Object) {
    hashObject(hash, value)
  } else {
    hash.update(stringify(value) || 'undefined')
  }

  return hash
}

export function hashArray(hash, array) {
  hash.update('[')
  for (let i = 0; i < array.length; i++) {
    hashify(hash, array[i])
    hash.update(',')
  }
  hash.update(']')

  return hash
}

export function hashObject(hash, object) {
  hash.update('{')
  Object.keys(object).sort().forEach(key => {
    hash.update(stringify(key))
    hash.update(':')
    hashify(hash, object[key])
    hash.update(',')
  })
  hash.update('}')

  return hash
}
