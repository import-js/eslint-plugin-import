var findRoot = require('find-root')
  , path = require('path')
  , get = require('lodash.get')
  , find = require('array-find')
  , interpret = require('interpret')
  // not available on 0.10.x
  , isAbsolute = path.isAbsolute || require('is-absolute')
  , fs = require('fs')
  , coreLibs = require('node-libs-browser')

const log = require('debug')('eslint-plugin-import:resolver:webpack')

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

  // strip resource query
  var finalQuestionMark = source.lastIndexOf('?')
  if (finalQuestionMark >= 0) {
    source = source.slice(0, finalQuestionMark)
  }

  if (source in coreLibs) {
    return { found: true, path: coreLibs[source] }
  }

  var webpackConfig

  try {
    var configPath = get(settings, 'config')
      , configIndex = get(settings, 'config-index')
      , packageDir

    if (configPath) log('Config path from settings:', configPath)

    // see if we've got an absolute path
    if (!configPath || !isAbsolute(configPath)) {
      // if not, find ancestral package.json and use its directory as base for the path
      packageDir = findRoot(path.resolve(file))
      if (!packageDir) throw new Error('package not found above ' + file)
    }

    configPath = findConfigPath(configPath, packageDir)

    log('Config path resolved to:', configPath)
    webpackConfig = require(configPath)

    if (webpackConfig && webpackConfig.default) {
      log('Using ES6 module "default" key instead of module.exports.')
      webpackConfig = webpackConfig.default
    }
  } catch (err) {
    log('Error during config lookup:', err)
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

  log('Using config: ', webpackConfig)

  // externals
  if (findExternal(source, webpackConfig.externals, path.dirname(file))) return { found: true, path: null }

  var otherPlugins = []

  // support webpack.ResolverPlugin
  if (webpackConfig.plugins) {
    webpackConfig.plugins.forEach(function (plugin) {
      if (plugin.constructor && plugin.constructor.name === 'ResolverPlugin' && Array.isArray(plugin.plugins)) {
        otherPlugins.push.apply(otherPlugins, plugin.plugins);
      }
    });
  }

  // otherwise, resolve "normally"
  var resolver = createResolver(webpackConfig.resolve || {}, otherPlugins)
  try {
    return { found: true, path: resolver.resolveSync(path.dirname(file), source) }
  } catch (err) {
    log('Error during module resolution:', err)
    return { found: false }
  }
}

var Resolver = require('enhanced-resolve/lib/Resolver')

var SyncNodeJsInputFileSystem = require('enhanced-resolve/lib/SyncNodeJsInputFileSystem')
var syncFS = new SyncNodeJsInputFileSystem()

var ModuleAliasPlugin = require('enhanced-resolve/lib/ModuleAliasPlugin')
var ModulesInDirectoriesPlugin = require('enhanced-resolve/lib/ModulesInDirectoriesPlugin')
var ModulesInRootPlugin = require('enhanced-resolve/lib/ModulesInRootPlugin')
var ModuleAsFilePlugin = require('enhanced-resolve/lib/ModuleAsFilePlugin')
var ModuleAsDirectoryPlugin = require('enhanced-resolve/lib/ModuleAsDirectoryPlugin')
var DirectoryDescriptionFilePlugin = require('enhanced-resolve/lib/DirectoryDescriptionFilePlugin')
var DirectoryDefaultFilePlugin = require('enhanced-resolve/lib/DirectoryDefaultFilePlugin')
var FileAppendPlugin = require('enhanced-resolve/lib/FileAppendPlugin')
var ResultSymlinkPlugin = require('enhanced-resolve/lib/ResultSymlinkPlugin')
var DirectoryDescriptionFileFieldAliasPlugin =
  require('enhanced-resolve/lib/DirectoryDescriptionFileFieldAliasPlugin')

// adapted from tests &
// https://github.com/webpack/webpack/blob/v1.13.0/lib/WebpackOptionsApply.js#L322
function createResolver(resolve, otherPlugins) {
  var resolver = new Resolver(syncFS)

  resolver.apply(
    resolve.packageAlias
      ? new DirectoryDescriptionFileFieldAliasPlugin('package.json', resolve.packageAlias)
      : function() {},
    new ModuleAliasPlugin(resolve.alias || {}),
    makeRootPlugin('module', resolve.root),
    new ModulesInDirectoriesPlugin('module', resolve.modulesDirectories || ['web_modules', 'node_modules']),
    makeRootPlugin('module', resolve.fallback),
    new ModuleAsFilePlugin('module'),
    new ModuleAsDirectoryPlugin('module'),
    new DirectoryDescriptionFilePlugin('package.json', ['jsnext:main'].concat(resolve.packageMains || defaultMains)),
    new DirectoryDefaultFilePlugin(['index']),
    new FileAppendPlugin(resolve.extensions || ['', '.webpack.js', '.web.js', '.js']),
    new ResultSymlinkPlugin()
  )

  resolver.apply.apply(resolver, otherPlugins);

  return resolver
}

/* eslint-disable */
// from https://github.com/webpack/webpack/blob/v1.13.0/lib/WebpackOptionsApply.js#L365
function makeRootPlugin(name, root) {
  if(typeof root === "string")
    return new ModulesInRootPlugin(name, root);
  else if(Array.isArray(root)) {
    return function() {
      root.forEach(function(root) {
        this.apply(new ModulesInRootPlugin(name, root));
      }, this);
    };
  }
  return function() {};
}
/* eslint-enable */

function findExternal(source, externals, context) {
  if (!externals) return false

  // string match
  if (typeof externals === 'string') return (source === externals)

  // array: recurse
  if (externals instanceof Array) {
    return externals.some(function (e) { return findExternal(source, e, context) })
  }

  if (externals instanceof RegExp) {
    return externals.test(source)
  }

  if (typeof externals === 'function') {
    var functionExternalFound = false
    externals.call(null, context, source, function(err, value) {
      if (err) {
        functionExternalFound = false
      } else {
        functionExternalFound = findExternal(source, value, context)
      }
    })
    return functionExternalFound
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

function findConfigPath(configPath, packageDir) {
  var extensions = Object.keys(interpret.extensions).sort(function(a, b) {
    return a === '.js' ? -1 : b === '.js' ? 1 : a.length - b.length
  })
    , extension


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
  return configPath
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
          log('Failed to register compiler for moduleDescriptor[]:', i, moduleDescriptor)
        }
      }
    }
  }
}
