import fs from 'fs'
import pkgUp from 'pkg-up'
import minimatch from 'minimatch'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function getDependencies(context) {
  const filepath = pkgUp.sync(context.getFilename())
  if (!filepath) {
    return null
  }

  try {
    const packageContent = JSON.parse(fs.readFileSync(filepath, 'utf8'))
    return {
      dependencies: packageContent.dependencies || {},
      devDependencies: packageContent.devDependencies || {},
      optionalDependencies: packageContent.optionalDependencies || {},
      peerDependencies: packageContent.peerDependencies || {},
    }
  } catch (e) {
    return null
  }
}

function missingErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies. ` +
    `Run 'npm i -S ${packageName}' to add it`
}

function devDepErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies, not devDependencies.`
}

function optDepErrorMessage(packageName) {
  return `'${packageName}' should be listed in the project's dependencies, ` +
    `not optionalDependencies.`
}

function reportIfMissing(context, deps, depsOptions, node, name) {
  if (importType(name, context) !== 'external') {
    return
  }
  const splitName = name.split('/')
  const packageName = splitName[0][0] === '@'
    ? splitName.slice(0, 2).join('/')
    : splitName[0]

  const isInDeps = deps.dependencies[packageName] !== undefined
  const isInDevDeps = deps.devDependencies[packageName] !== undefined
  const isInOptDeps = deps.optionalDependencies[packageName] !== undefined
  const isInPeerDeps = deps.peerDependencies[packageName] !== undefined

  if (isInDeps ||
    (depsOptions.allowDevDeps && isInDevDeps) ||
    (depsOptions.allowPeerDeps && isInPeerDeps) ||
    (depsOptions.allowOptDeps && isInOptDeps)
  ) {
    return
  }

  if (isInDevDeps && !depsOptions.allowDevDeps) {
    context.report(node, devDepErrorMessage(packageName))
    return
  }

  if (isInOptDeps && !depsOptions.allowOptDeps) {
    context.report(node, optDepErrorMessage(packageName))
    return
  }

  context.report(node, missingErrorMessage(packageName))
}

function testConfig(config, filename) {
  // Simplest configuration first, either a boolean or nothing.
  if (typeof config === 'boolean' || typeof config === 'undefined') {
    return config
  }
  // Array of globs.
  return config.some(c => minimatch(filename, c))
}

module.exports = function (context) {
  const options = context.options[0] || {}
  const filename = context.getFilename()
  const deps = getDependencies(context)

  if (!deps) {
    return {}
  }

  const depsOptions = {
    allowDevDeps: testConfig(options.devDependencies, filename) !== false,
    allowOptDeps: testConfig(options.optionalDependencies, filename) !== false,
    allowPeerDeps: testConfig(options.peerDependencies, filename) !== false,
  }

  // todo: use module visitor from module-utils core
  return {
    ImportDeclaration: function (node) {
      reportIfMissing(context, deps, depsOptions, node, node.source.value)
    },
    CallExpression: function handleRequires(node) {
      if (isStaticRequire(node)) {
        reportIfMissing(context, deps, depsOptions, node, node.arguments[0].value)
      }
    },
  }
}

module.exports.schema = [
  {
    'type': 'object',
    'properties': {
      'devDependencies': { 'type': ['boolean', 'array'] },
      'optionalDependencies': { 'type': ['boolean', 'array'] },
      'peerDependencies': { 'type': ['boolean', 'array'] },
    },
    'additionalProperties': false,
  },
]
