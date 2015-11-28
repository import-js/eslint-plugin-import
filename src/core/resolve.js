import fs from 'fs'
import { dirname, basename, join } from 'path'

const CASE_INSENSITIVE = fs.existsSync(join(__dirname, 'reSOLVE.js'))

// http://stackoverflow.com/a/27382838
function fileExistsWithCaseSync(filepath) {
  var dir = dirname(filepath)
  if (dir === '/' || dir === '.' || /^[A-Z]:\\$/i.test(dir)) return true
  var filenames = fs.readdirSync(dir)
  if (filenames.indexOf(basename(filepath)) === -1) {
      return false
  }
  return fileExistsWithCaseSync(dir)
}

function fileExists(filepath) {
  if (CASE_INSENSITIVE) {
    // short-circuit if path doesn't exist, ignoring case
    return !(!fs.existsSync(filepath) || !fileExistsWithCaseSync(filepath))
  } else {
    return fs.existsSync(filepath)
  }
}

export function relative(modulePath, sourceFile, settings) {

  function withResolver(resolver, config) {
    // resolve just returns the core module id, which won't appear to exist
    try {
      const filePath = resolver.resolveImport(modulePath, sourceFile, config)
      if (filePath === null) return null

      if (filePath === undefined || !fileExists(filePath)) return undefined

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
