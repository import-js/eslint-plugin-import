import findRoot from 'find-root'
import path from 'path'


/**
 * Find the full path to 'source', given 'file' as a full reference path.
 *
 * resolveImport('./foo', '/Users/ben/bar.js') => '/Users/ben/foo.js'
 * @param  {string} source - the module to resolve; i.e './some-module'
 * @param  {string} file - the importing file's full path; i.e. '/usr/local/bin/file.js'
 * TODO: take options as a third param, with webpack config file name
 * @return {string} the resolved path to source, or undefined if not resolved
 */
export default function resolveImport(source, file) {
  const packageDir = findRoot(file)
  if (!packageDir) throw new Error('package not found above ' + file)

  const webpackConfig = require(path.join(packageDir, 'webpack.config.js'))
  if (!webpackConfig.resolve) throw new Error('no custom webpack resolve config')

  if (webpackConfig.resolve.alias &&
      source in webpackConfig.resolve.alias) {
    // simple alias lookup
    return webpackConfig.resolve.alias[source]
  }
}
