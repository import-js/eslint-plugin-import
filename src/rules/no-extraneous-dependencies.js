import fs from 'fs'
import pkgUp from 'pkg-up'
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

function reportIfMissing(context, deps, allowDevDeps, allowOptDeps, node, name) {
  if (importType(name, context) !== 'external') {
    return
  }
  const packageName = name.split('/')[0]

  const isInDeps = deps.dependencies[packageName] !== undefined
  const isInDevDeps = deps.devDependencies[packageName] !== undefined
  const isInOptDeps = deps.optionalDependencies[packageName] !== undefined

  if (isInDeps ||
    (allowDevDeps && isInDevDeps) ||
    (allowOptDeps && isInOptDeps)
  ) {
    return
  }

  if (isInDevDeps && !allowDevDeps) {
    context.report(node, devDepErrorMessage(packageName))
    return
  }

  if (isInOptDeps && !allowOptDeps) {
    context.report(node, optDepErrorMessage(packageName))
    return
  }

  context.report(node, missingErrorMessage(packageName))
}

module.exports = function (context) {
  const options = context.options[0] || {}
  const allowDevDeps = options.devDependencies !== false
  const allowOptDeps = options.optionalDependencies !== false
  const deps = getDependencies(context)

  if (!deps) {
    return {}
  }

  // todo: use module visitor from module-utils core
  return {
    ImportDeclaration: function (node) {
      reportIfMissing(context, deps, allowDevDeps, allowOptDeps, node, node.source.value)
    },
    CallExpression: function handleRequires(node) {
      if (isStaticRequire(node)) {
        reportIfMissing(context, deps, allowDevDeps, allowOptDeps, node, node.arguments[0].value)
      }
    },
  }
}

module.exports.schema = [
  {
    'type': 'object',
    'properties': {
      'devDependencies': { 'type': 'boolean' },
      'optionalDependencies': { 'type': 'boolean' },
    },
    'additionalProperties': false,
  },
]
