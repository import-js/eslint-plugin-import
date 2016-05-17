var findRoot = require('find-root')
  , path = require('path')
  , resolve = require('resolve')
  , get = require('lodash.get')
  , find = require('array-find')
  , interpret = require('interpret')
  // not available on 0.10.x
  , isAbsolute = path.isAbsolute || require('is-absolute')
  , fs = require('fs')

var resolveAlias = require('./resolve-alias')

exports.interfaceVersion = 2

/**
 * Find the full path to 'source', given 'file' as a full reference path.
 *
 * resolveImport('./foo', '/Users/ben/bar.js') => '/Users/ben/foo.js'
 * @param  {string} source - the module to resolve; i.e './some-module'
 * @param  {string} file - the importing file's full path; i.e. '/usr/local/bin/file.js'
 * TODO: take options as a third param, with webpack config file name
 * @return {string?} the resolved path to source, undefined if not resolved, or null
 *                   if resolved to a non-FS resource (i.e. script tag at page load)
 */
exports.resolve = function (source, file, settings) {

  // strip loaders
  var finalBang = source.lastIndexOf('!')
  if (finalBang >= 0) {
    source = source.slice(finalBang + 1)
  }

  if (resolve.isCore(source)) return { found: true, path: null }

  var webpackConfig

  var extensions = Object.keys(interpret.extensions).sort(function(a, b) {
    return a === '.js' ? -1 : b === '.js' ? 1 : a.length - b.length
  })

  try {
    var configPath = get(settings, 'config')
      , configIndex = get(settings, 'config-index')
      , packageDir
      , extension

    // see if we've got an absolute path
    if (!configPath || !isAbsolute(configPath)) {
      // if not, find ancestral package.json and use its directory as base for the path
      packageDir = findRoot(path.resolve(file))
      if (!packageDir) throw new Error('package not found above ' + file)
    }

    if (configPath) {
      // extensions is not reused below, so safe to mutate it here.
      extensions.reverse()
      extensions.forEach(function (maybeExtension) {
        if (extension) {
          return
        }

        if (configPath.substr(-maybeExtension.length) === maybeExtension) {
          extension = maybeExtension
        }
      })

      // see if we've got an absolute path
      if (!isAbsolute(configPath)) {
        configPath = path.join(packageDir, configPath)
      }
    } else {
      extensions.forEach(function (maybeExtension) {
        if (extension) {
          return
        }

        var maybePath = path.resolve(
          path.join(packageDir, 'webpack.config' + maybeExtension)
        )
        if (fs.existsSync(maybePath)) {
          configPath = maybePath
          extension = maybeExtension
        }
      })
    }

    registerCompiler(interpret.extensions[extension])
    webpackConfig = require(configPath)

    if (webpackConfig && webpackConfig.default) {
      webpackConfig = webpackConfig.default
    }
  } catch (err) {
    webpackConfig = {}
  }

  if (Array.isArray(webpackConfig)) {
    if (typeof configIndex !== 'undefined' && webpackConfig.length > configIndex) {
      webpackConfig = webpackConfig[configIndex]
    }
    else {
      webpackConfig = find(webpackConfig, function findFirstWithResolve(config) {
        return !!config.resolve
      })
    }
  }

  // externals
  if (findExternal(source, webpackConfig.externals)) return { found: true, path: null }

  // replace alias if needed
  source = resolveAlias(source, get(webpackConfig, ['resolve', 'alias'], {}))

  var paths = []

  // root as first alternate path
  var rootPath = get(webpackConfig, ['resolve', 'root'])

  if (rootPath) {
    if (typeof rootPath === 'string') paths.push(rootPath)
    else paths.push.apply(paths, rootPath)
  }

  // set fallback paths
  var fallbackPath = get(webpackConfig, ['resolve', 'fallback'])
  if (fallbackPath) {
    if (typeof fallbackPath === 'string') paths.push(fallbackPath)
    else paths.push.apply(paths, fallbackPath)
  }


  // otherwise, resolve "normally"
  try {

    return { found: true, path: resolve.sync(source, {
      basedir: path.dirname(file),

      // defined via http://webpack.github.io/docs/configuration.html#resolve-extensions
      extensions: get(webpackConfig, ['resolve', 'extensions'])
        || ['', '.webpack.js', '.web.js', '.js'],

      // http://webpack.github.io/docs/configuration.html#resolve-modulesdirectories
      moduleDirectory: get(webpackConfig, ['resolve', 'modulesDirectories'])
        || ['web_modules', 'node_modules'],

      paths: paths,
      packageFilter: packageFilter.bind(null, webpackConfig),
    }) }
  } catch (err) {
    return { found: false }
  }
}

function findExternal(source, externals) {
  if (!externals) return false

  // string match
  if (typeof externals === 'string') return (source === externals)

  // array: recurse
  if (externals instanceof Array) {
    return externals.some(function (e) { return findExternal(source, e) })
  }

  if (externals instanceof RegExp) {
    return externals.test(source)
  }

  if (typeof externals === 'function') {
    throw new Error('unable to handle function externals')
  }

  // else, vanilla object
  for (var key in externals) {
    if (!externals.hasOwnProperty(key)) continue
    if (source === key) return true
  }
  return false
}

/**
 * webpack defaults: http://webpack.github.io/docs/configuration.html#resolve-packagemains
 * @type {Array}
 */
var defaultMains = [
  'webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main',
]

function packageFilter(config, pkg) {
  var altMain

  // check for rollup-style first
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  } else {
    // check for configured/default alternative main fields
    altMain = find(
      get(config, ['resolve', 'packageMains']) || defaultMains,
      function (m) { return typeof get(pkg, m) === 'string' })

    if (altMain) {
      pkg['main'] = get(pkg, altMain)
    }
  }


  return pkg
}


function registerCompiler(moduleDescriptor) {
  if(moduleDescriptor) {
    if(typeof moduleDescriptor === 'string') {
      require(moduleDescriptor)
    } else if(!Array.isArray(moduleDescriptor)) {
      moduleDescriptor.register(require(moduleDescriptor.module))
    } else {
      for(var i = 0; i < moduleDescriptor.length; i++) {
        try {
          registerCompiler(moduleDescriptor[i])
          break
        } catch(e) {
          // do nothing
        }
      }
    }
  }
}
