"use strict"
exports.__esModule = true

const pkgDir = require('pkg-dir')

const fs = require('fs')
const path = require('path')

const hashObject = require('./hash').hashObject

const CASE_SENSITIVE_FS = !fs.existsSync(path.join(__dirname, 'reSOLVE.js'))
exports.CASE_SENSITIVE_FS = CASE_SENSITIVE_FS

const fileExistsCache = new Map()

function cachePath(cacheKey, result) {
  fileExistsCache.set(cacheKey, { result, lastSeen: Date.now() })
}

function checkCache(cacheKey, settings) {
  if (fileExistsCache.has(cacheKey)) {
    const f = fileExistsCache.get(cacheKey)
    // check fresness
    if (Date.now() - f.lastSeen < (settings.lifetime * 1000)) return f.result
  }
  // cache miss
  return undefined
}

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath, cacheSettings) {
  // don't care if the FS is case-sensitive
  if (CASE_SENSITIVE_FS) return true

  // null means it resolved to a builtin
  if (filepath === null) return true

  const dir = path.dirname(filepath)

  let result = checkCache(filepath, cacheSettings)
  if (result != null) return result

  // base case
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/i.test(dir)) {
    result = true
  } else {
    const filenames = fs.readdirSync(dir)
    if (filenames.indexOf(path.basename(filepath)) === -1) {
      result = false
    } else {
      result = fileExistsWithCaseSync(dir, cacheSettings)
    }
  }
  cachePath(filepath, result)
  return result
}

function relative(modulePath, sourceFile, settings) {
  return fullResolve(modulePath, sourceFile, settings).path
}

function fullResolve(modulePath, sourceFile, settings) {
  // check if this is a bonus core module
  const coreSet = new Set(settings['import/core-modules'])
  if (coreSet != null && coreSet.has(modulePath)) return { found: true, path: null }

  const sourceDir = path.dirname(sourceFile)
      , cacheKey = sourceDir + hashObject(settings).digest('hex') + modulePath

  const cacheSettings = Object.assign({
    lifetime: 30,  // seconds
  }, settings['import/cache'])

  // parse infinity
  if (cacheSettings.lifetime === '∞' || cacheSettings.lifetime === 'Infinity') {
    cacheSettings.lifetime = Infinity
  }

  const cachedPath = checkCache(cacheKey, cacheSettings)
  if (cachedPath !== undefined) return { found: true, path: cachedPath }

  function cache(resolvedPath) {
    cachePath(cacheKey, resolvedPath)
  }

  function withResolver(resolver, config) {

    function v1() {
      try {
        const resolved = resolver.resolveImport(modulePath, sourceFile, config)
        if (resolved === undefined) return { found: false }
        return { found: true, path: resolved }
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

  for (let pair of resolvers) {
    let name = pair[0]
      , config = pair[1]
    const resolver = requireResolver(name, sourceFile)
        , resolved = withResolver(resolver, config)

    if (!resolved.found) continue

    // resolvers imply file existence, this double-check just ensures the case matches
    if (!fileExistsWithCaseSync(resolved.path, cacheSettings)) continue

    // else, counts
    cache(resolved.path)
    return resolved
  }

  // failed
  // cache(undefined)
  return { found: false }
}
exports.relative = relative

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

function requireResolver(name, sourceFile) {
  // Try to resolve package with conventional name
  try {
    return require(`eslint-import-resolver-${name}`)
  } catch (err) { /* continue */ }

  // Try to resolve package with custom name (@myorg/resolver-name)
  try {
    return require(name)
  } catch (err) { /* continue */ }

  // Try to resolve package with path, relative to closest package.json
  // or current working directory
  try {
    const baseDir = pkgDir.sync(sourceFile) || process.cwd()
    // absolute paths ignore base, so this covers both
    return require(path.resolve(baseDir, name))
  } catch (err) { /* continue */ }

  // all else failed
  throw new Error(`unable to load resolver "${name}".`)
}

const erroredContexts = new Set()

/**
 * Given
 * @param  {string} p - module path
 * @param  {object} context - ESLint context
 * @return {string} - the full module filesystem path;
 *                    null if package is core;
 *                    undefined if not found
 */
function resolve(p, context) {
  try {
    return relative( p
                   , context.getFilename()
                   , context.settings
                   )
  } catch (err) {
    if (!erroredContexts.has(context)) {
      context.report({
        message: `Resolve error: ${err.message}`,
        loc: { line: 1, col: 0 },
      })
      erroredContexts.add(context)
    }
  }
}
resolve.relative = relative
exports.default = resolve
