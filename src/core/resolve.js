import 'es6-symbol/implement'
import Map from 'es6-map'
import assign from 'object-assign'

import fs from 'fs'
import { dirname, basename, join } from 'path'

export const CASE_INSENSITIVE = fs.existsSync(join(__dirname, 'reSOLVE.js'))

const fileExistsCache = new Map()

function cachePath(cacheKey, result) {
  fileExistsCache.set(cacheKey, { result, lastSeen: Date.now() })
}

function checkCache(cacheKey, { lifetime }) {
  if (fileExistsCache.has(cacheKey)) {
    const { result, lastSeen } = fileExistsCache.get(cacheKey)
    // check fresness
    if (Date.now() - lastSeen < (lifetime * 1000)) return result
  }
  // cache miss
  return undefined
}

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath, cacheSettings) {
  const dir = dirname(filepath)

  let result = checkCache(filepath, cacheSettings)
  if (result != null) return result

  // base case
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/i.test(dir)) {
    result = true
  } else {
    const filenames = fs.readdirSync(dir)
    if (filenames.indexOf(basename(filepath)) === -1) {
      result = false
    } else {
      result = fileExistsWithCaseSync(dir, cacheSettings)
    }
  }
  cachePath(filepath, result)
  return result
}

export function relative(modulePath, sourceFile, settings) {

  const sourceDir = dirname(sourceFile)
      , cacheKey = sourceDir + hashObject(settings) + modulePath

  const cacheSettings = assign({
    lifetime: 30,  // seconds
  }, settings['import/cache'])

  // parse infinity
  if (cacheSettings.lifetime === '∞' || cacheSettings.lifetime === 'Infinity') {
    cacheSettings.lifetime = Infinity
  }

  const cachedPath = checkCache(cacheKey, cacheSettings)
  if (cachedPath !== undefined) return cachedPath

  function cache(path) {
    cachePath(cacheKey, path)
    return path
  }

  function withResolver(resolver, config) {

    function v1() {
      try {
        const path = resolver.resolveImport(modulePath, sourceFile, config)
        if (path === undefined) return { found: false }
        return { found: true, path }
      } catch (err) {
        return { found: false }
      }
    }

    function v2() {
      return resolver.resolve(modulePath, sourceFile, config)
    }

    switch (resolver.interfaceVersion) {
      case 2:
        return v2()

      default:
      case 1:
        return v1()
    }
  }

  const configResolvers = (settings['import/resolver']
    || { 'node': settings['import/resolve'] }) // backward compatibility

  const resolvers = resolverReducer(configResolvers, new Map())

  for (let [name, config] of resolvers) {
    const resolver = require(`eslint-import-resolver-${name}`)

    let { path: fullPath, found } = withResolver(resolver, config)

    // resolvers imply file existence, this double-check just ensures the case matches
    if (found && CASE_INSENSITIVE && !fileExistsWithCaseSync(fullPath, cacheSettings)) {
      // reject resolved path
      fullPath = undefined
    }

    if (found) return cache(fullPath)
  }

  return cache(undefined)
}

function resolverReducer(resolvers, map) {
  if (resolvers instanceof Array) {
    resolvers.forEach(r => resolverReducer(r, map))
    return map
  }

  if (typeof resolvers === 'string') {
    map.set(resolvers, null)
    return map
  }

  if (typeof resolvers === 'object') {
    for (let key in resolvers) {
      map.set(key, resolvers[key])
    }
    return map
  }

  throw new Error('invalid resolver config')
}

/**
 * Givent
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path;
 *                    null if package is core;
 *                    undefined if not found
 */
export default function resolve(p, context) {
  return relative( p
                 , context.getFilename()
                 , context.settings
                 )
}
resolve.relative = relative


import { createHash } from 'crypto'
function hashObject(object) {
  const settingsShasum = createHash('sha1')
  settingsShasum.update(JSON.stringify(object))
  return settingsShasum.digest('hex')
}
