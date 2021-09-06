'use strict';

const findRoot = require('find-root');
const path = require('path');
const get = require('lodash/get');
const isEqual = require('lodash/isEqual');
const find = require('array-find');
const interpret = require('interpret');
const fs = require('fs');
const isCore = require('is-core-module');
const resolve = require('resolve');
const semver = require('semver');
const has = require('has');
const isRegex = require('is-regex');

const log = require('debug')('eslint-plugin-import:resolver:webpack');

exports.interfaceVersion = 2;

/**
 * Find the full path to 'source', given 'file' as a full reference path.
 *
 * resolveImport('./foo', '/Users/ben/bar.js') => '/Users/ben/foo.js'
 * @param  {string} source - the module to resolve; i.e './some-module'
 * @param  {string} file - the importing file's full path; i.e. '/usr/local/bin/file.js'
 * @param  {object} settings - the webpack config file name, as well as cwd
 * @example
 * options: {
 *  // Path to the webpack config
 *  config: 'webpack.config.js',
 *  // Path to be used to determine where to resolve webpack from
 *  // (may differ from the cwd in some cases)
 *  cwd: process.cwd()
 * }
 * @return {string?} the resolved path to source, undefined if not resolved, or null
 *                   if resolved to a non-FS resource (i.e. script tag at page load)
 */
exports.resolve = function (source, file, settings) {

  // strip loaders
  const finalBang = source.lastIndexOf('!');
  if (finalBang >= 0) {
    source = source.slice(finalBang + 1);
  }

  // strip resource query
  const finalQuestionMark = source.lastIndexOf('?');
  if (finalQuestionMark >= 0) {
    source = source.slice(0, finalQuestionMark);
  }

  let webpackConfig;

  const _configPath = get(settings, 'config');
  /**
     * Attempt to set the current working directory.
     * If none is passed, default to the `cwd` where the config is located.
     */
  const cwd = get(settings, 'cwd');
  const configIndex = get(settings, 'config-index');
  const env = get(settings, 'env');
  const argv = get(settings, 'argv', {});
  let packageDir;

  let configPath = typeof _configPath === 'string' && _configPath.startsWith('.')
    ? path.resolve(_configPath)
    : _configPath;

  log('Config path from settings:', configPath);

  // see if we've got a config path, a config object, an array of config objects or a config function
  if (!configPath || typeof configPath === 'string') {

    // see if we've got an absolute path
    if (!configPath || !path.isAbsolute(configPath)) {
      // if not, find ancestral package.json and use its directory as base for the path
      packageDir = findRoot(path.resolve(file));
      if (!packageDir) throw new Error('package not found above ' + file);
    }

    configPath = findConfigPath(configPath, packageDir);

    log('Config path resolved to:', configPath);
    if (configPath) {
      try {
        webpackConfig = require(configPath);
      } catch (e) {
        console.log('Error resolving webpackConfig', e);
        throw e;
      }
    } else {
      log('No config path found relative to', file, '; using {}');
      webpackConfig = {};
    }

    if (webpackConfig && webpackConfig.default) {
      log('Using ES6 module "default" key instead of module.exports.');
      webpackConfig = webpackConfig.default;
    }

  } else {
    webpackConfig = configPath;
    configPath = null;
  }

  if (typeof webpackConfig === 'function') {
    webpackConfig = webpackConfig(env, argv);
  }

  if (Array.isArray(webpackConfig)) {
    webpackConfig = webpackConfig.map(cfg => {
      if (typeof cfg === 'function') {
        return cfg(env, argv);
      }

      return cfg;
    });

    if (typeof configIndex !== 'undefined' && webpackConfig.length > configIndex) {
      webpackConfig = webpackConfig[configIndex];
    } else {
      webpackConfig = find(webpackConfig, function findFirstWithResolve(config) {
        return !!config.resolve;
      });
    }
  }

  if (typeof webpackConfig.then === 'function') {
    webpackConfig = {};

    console.warn('Webpack config returns a `Promise`; that signature is not supported at the moment. Using empty object instead.');
  }

  if (webpackConfig == null) {
    webpackConfig = {};

    console.warn('No webpack configuration with a "resolve" field found. Using empty object instead.');
  }

  log('Using config: ', webpackConfig);

  const resolveSync = getResolveSync(configPath, webpackConfig, cwd);

  // externals
  if (findExternal(source, webpackConfig.externals, path.dirname(file), resolveSync)) {
    return { found: true, path: null };
  }

  // otherwise, resolve "normally"

  try {
    return { found: true, path: resolveSync(path.dirname(file), source) };
  } catch (err) {
    if (isCore(source)) {
      return { found: true, path: null };
    }

    log('Error during module resolution:', err);
    return { found: false };
  }
};

const MAX_CACHE = 10;
const _cache = [];
function getResolveSync(configPath, webpackConfig, cwd) {
  const cacheKey = { configPath, webpackConfig };
  let cached = find(_cache, function (entry) { return isEqual(entry.key, cacheKey); });
  if (!cached) {
    cached = {
      key: cacheKey,
      value: createResolveSync(configPath, webpackConfig, cwd),
    };
    // put in front and pop last item
    if (_cache.unshift(cached) > MAX_CACHE) {
      _cache.pop();
    }
  }
  return cached.value;
}

function createResolveSync(configPath, webpackConfig, cwd) {
  let webpackRequire;
  let basedir = null;

  if (typeof configPath === 'string') {
    // This can be changed via the settings passed in when defining the resolver
    basedir = cwd || configPath;
    log(`Attempting to load webpack path from ${basedir}`);
  }

  try {
    // Attempt to resolve webpack from the given `basedir`
    const webpackFilename = resolve.sync('webpack', { basedir, preserveSymlinks: false });
    const webpackResolveOpts = { basedir: path.dirname(webpackFilename), preserveSymlinks: false };

    webpackRequire = function (id) {
      return require(resolve.sync(id, webpackResolveOpts));
    };
  } catch (e) {
    // Something has gone wrong (or we're in a test). Use our own bundled
    // enhanced-resolve.
    log('Using bundled enhanced-resolve.');
    webpackRequire = require;
  }

  const enhancedResolvePackage = webpackRequire('enhanced-resolve/package.json');
  const enhancedResolveVersion = enhancedResolvePackage.version;
  log('enhanced-resolve version:', enhancedResolveVersion);

  const resolveConfig = webpackConfig.resolve || {};

  if (semver.major(enhancedResolveVersion) >= 2) {
    return createWebpack2ResolveSync(webpackRequire, resolveConfig);
  }

  return createWebpack1ResolveSync(webpackRequire, resolveConfig, webpackConfig.plugins);
}

/**
 * webpack 2 defaults:
 * https://github.com/webpack/webpack/blob/v2.1.0-beta.20/lib/WebpackOptionsDefaulter.js#L72-L87
 * @type {Object}
 */
const webpack2DefaultResolveConfig = {
  unsafeCache: true, // Probably a no-op, since how can we cache anything at all here?
  modules: ['node_modules'],
  extensions: ['.js', '.json'],
  aliasFields: ['browser'],
  mainFields: ['browser', 'module', 'main'],
};

function createWebpack2ResolveSync(webpackRequire, resolveConfig) {
  const EnhancedResolve = webpackRequire('enhanced-resolve');

  return EnhancedResolve.create.sync(Object.assign({}, webpack2DefaultResolveConfig, resolveConfig));
}

/**
 * webpack 1 defaults: http://webpack.github.io/docs/configuration.html#resolve-packagemains
 * @type {Array}
 */
const webpack1DefaultMains = [
  'webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main',
];

// adapted from tests &
// https://github.com/webpack/webpack/blob/v1.13.0/lib/WebpackOptionsApply.js#L322
function createWebpack1ResolveSync(webpackRequire, resolveConfig, plugins) {
  const Resolver = webpackRequire('enhanced-resolve/lib/Resolver');
  const SyncNodeJsInputFileSystem = webpackRequire('enhanced-resolve/lib/SyncNodeJsInputFileSystem');

  const ModuleAliasPlugin = webpackRequire('enhanced-resolve/lib/ModuleAliasPlugin');
  const ModulesInDirectoriesPlugin = webpackRequire('enhanced-resolve/lib/ModulesInDirectoriesPlugin');
  const ModulesInRootPlugin = webpackRequire('enhanced-resolve/lib/ModulesInRootPlugin');
  const ModuleAsFilePlugin = webpackRequire('enhanced-resolve/lib/ModuleAsFilePlugin');
  const ModuleAsDirectoryPlugin = webpackRequire('enhanced-resolve/lib/ModuleAsDirectoryPlugin');
  const DirectoryDescriptionFilePlugin = webpackRequire('enhanced-resolve/lib/DirectoryDescriptionFilePlugin');
  const DirectoryDefaultFilePlugin = webpackRequire('enhanced-resolve/lib/DirectoryDefaultFilePlugin');
  const FileAppendPlugin = webpackRequire('enhanced-resolve/lib/FileAppendPlugin');
  const ResultSymlinkPlugin = webpackRequire('enhanced-resolve/lib/ResultSymlinkPlugin');
  const DirectoryDescriptionFileFieldAliasPlugin = webpackRequire('enhanced-resolve/lib/DirectoryDescriptionFileFieldAliasPlugin');

  const resolver = new Resolver(new SyncNodeJsInputFileSystem());

  resolver.apply(
    resolveConfig.packageAlias
      ? new DirectoryDescriptionFileFieldAliasPlugin('package.json', resolveConfig.packageAlias)
      : function () {},
    new ModuleAliasPlugin(resolveConfig.alias || {}),
    makeRootPlugin(ModulesInRootPlugin, 'module', resolveConfig.root),
    new ModulesInDirectoriesPlugin(
      'module',
      resolveConfig.modulesDirectories || resolveConfig.modules || ['web_modules', 'node_modules'],
    ),
    makeRootPlugin(ModulesInRootPlugin, 'module', resolveConfig.fallback),
    new ModuleAsFilePlugin('module'),
    new ModuleAsDirectoryPlugin('module'),
    new DirectoryDescriptionFilePlugin(
      'package.json',
      ['module', 'jsnext:main'].concat(resolveConfig.packageMains || webpack1DefaultMains),
    ),
    new DirectoryDefaultFilePlugin(['index']),
    new FileAppendPlugin(resolveConfig.extensions || ['', '.webpack.js', '.web.js', '.js']),
    new ResultSymlinkPlugin(),
  );


  const resolvePlugins = [];

  // support webpack.ResolverPlugin
  if (plugins) {
    plugins.forEach(function (plugin) {
      if (
        plugin.constructor &&
        plugin.constructor.name === 'ResolverPlugin' &&
        Array.isArray(plugin.plugins)
      ) {
        resolvePlugins.push.apply(resolvePlugins, plugin.plugins);
      }
    });
  }

  resolver.apply.apply(resolver, resolvePlugins);

  return function () {
    return resolver.resolveSync.apply(resolver, arguments);
  };
}

/* eslint-disable */
// from https://github.com/webpack/webpack/blob/v1.13.0/lib/WebpackOptionsApply.js#L365
function makeRootPlugin(ModulesInRootPlugin, name, root) {
  if (typeof root === 'string') {
    return new ModulesInRootPlugin(name, root);
  } else if (Array.isArray(root)) {
    return function() {
      root.forEach(function (root) {
        this.apply(new ModulesInRootPlugin(name, root));
      }, this);
    };
  }
  return function () {};
}
/* eslint-enable */

function findExternal(source, externals, context, resolveSync) {
  if (!externals) return false;

  // string match
  if (typeof externals === 'string') return (source === externals);

  // array: recurse
  if (Array.isArray(externals)) {
    return externals.some(function (e) { return findExternal(source, e, context, resolveSync); });
  }

  if (isRegex(externals)) {
    return externals.test(source);
  }

  if (typeof externals === 'function') {
    let functionExternalFound = false;
    const callback = function (err, value) {
      if (err) {
        functionExternalFound = false;
      } else {
        functionExternalFound = findExternal(source, value, context, resolveSync);
      }
    };
    // - for prior webpack 5, 'externals function' uses 3 arguments
    // - for webpack 5, the count of arguments is less than 3
    if (externals.length === 3) {
      externals.call(null, context, source, callback);
    } else {
      const ctx = {
        context,
        request: source,
        contextInfo: {
          issuer: '',
          issuerLayer: null,
          compiler: '',
        },
        getResolve: () => (resolveContext, requestToResolve, cb) => {
          if (cb) {
            try {
              cb(null, resolveSync(resolveContext, requestToResolve));
            } catch (e) {
              cb(e);
            }
          } else {
            log('getResolve without callback not supported');
            return Promise.reject(new Error('Not supported'));
          }
        },
      };
      const result = externals.call(null, ctx, callback);
      // todo handling Promise object (using synchronous-promise package?)
      if (result && typeof result.then === 'function') {
        log('Asynchronous functions for externals not supported');
      }
    }
    return functionExternalFound;
  }

  // else, vanilla object
  for (const key in externals) {
    if (!has(externals, key)) continue;
    if (source === key) return true;
  }
  return false;
}

function findConfigPath(configPath, packageDir) {
  const extensions = Object.keys(interpret.extensions).sort(function (a, b) {
    return a === '.js' ? -1 : b === '.js' ? 1 : a.length - b.length;
  });
  let extension;


  if (configPath) {
    // extensions is not reused below, so safe to mutate it here.
    extensions.reverse();
    extensions.forEach(function (maybeExtension) {
      if (extension) {
        return;
      }

      if (configPath.substr(-maybeExtension.length) === maybeExtension) {
        extension = maybeExtension;
      }
    });

    // see if we've got an absolute path
    if (!path.isAbsolute(configPath)) {
      configPath = path.join(packageDir, configPath);
    }
  } else {
    extensions.forEach(function (maybeExtension) {
      if (extension) {
        return;
      }

      const maybePath = path.resolve(
        path.join(packageDir, 'webpack.config' + maybeExtension),
      );
      if (fs.existsSync(maybePath)) {
        configPath = maybePath;
        extension = maybeExtension;
      }
    });
  }

  registerCompiler(interpret.extensions[extension]);
  return configPath;
}

function registerCompiler(moduleDescriptor) {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      for (let i = 0; i < moduleDescriptor.length; i++) {
        try {
          registerCompiler(moduleDescriptor[i]);
          break;
        } catch (e) {
          log('Failed to register compiler for moduleDescriptor[]:', i, moduleDescriptor);
        }
      }
    }
  }
}
