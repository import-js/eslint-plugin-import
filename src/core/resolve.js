import fs from 'fs'
import { dirname, basename, join } from 'path'

const CASE_INSENSITIVE = fs.existsSync(join(__dirname, 'reSOLVE.js'))

const fileExistsCache = new Map()

function cachePath(filepath, result) {
  fileExistsCache.set(filepath, { result, lastSeen: Date.now() })
}

function checkCache(filepath, { lifetime }) {
  if (fileExistsCache.has(filepath)) {
    const { result, lastSeen } = fileExistsCache.get(filepath)
    // check fresness
    if (Date.now() - lastSeen < (lifetime * 1000)) return result
  }
  // cache miss
  return null
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

function fileExists(filepath, cacheSettings) {
  let result = checkCache(filepath, cacheSettings)
  if (result != null) return result

  result = fs.existsSync(filepath)

  // short-circuit if path doesn't exist, ignoring case
  if (result && CASE_INSENSITIVE) {
    result = fileExistsWithCaseSync(filepath, cacheSettings)
  }

  cachePath(filepath, result)
  return result
}

export function relative(modulePath, sourceFile, settings) {

  const cacheSettings = Object.assign({
    lifetime: 30,  // seconds
  }, settings['import/cache'])

  // parse infinity
  if (cacheSettings.lifetime === '∞' || cacheSettings.lifetime === 'Infinity') {
    cacheSettings.lifetime = Infinity
  }

  function withResolver(resolver, config) {
    // resolve just returns the core module id, which won't appear to exist
    try {
      const filePath = resolver.resolveImport(modulePath, sourceFile, config)
      if (filePath === null) return null

      if (filePath === undefined || !fileExists(filePath, cacheSettings)) return undefined

      return filePath
    } catch (err) {
      return undefined
    }
  }

  const configResolvers = (settings['import/resolver']
    || { 'node': settings['import/resolve'] }) // backward compatibility

  const resolvers = resolverReducer(configResolvers, new Map())

  for (let [name, config] of resolvers.entries()) {
    const resolver = require(`eslint-import-resolver-${name}`)

    let fullPath = withResolver(resolver, config)
    if (fullPath !== undefined) return fullPath
  }

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
