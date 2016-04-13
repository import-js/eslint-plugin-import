import fs from 'fs'
import pkgUp from 'pkg-up'
import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function getDependencies() {
  const filepath = pkgUp.sync()
	if (!filepath) {
		return null
	}

	try {
		const packageContent = JSON.parse(fs.readFileSync(filepath, 'utf8'))
		return {
      dependencies: packageContent.dependencies || {},
      devDependencies: packageContent.devDependencies || {},
    }
	} catch (e) {
		return null
	}
}

function missingErrorMessage(packageName) {
	return `'${packageName}' is not listed in the project's dependencies. ` +
		`Run 'npm i -S ${packageName}' to add it`
}

function devDepErrorMessage(packageName) {
	return `'${packageName}' is not listed in the project's dependencies, not devDependencies.`
}

function reportIfMissing(context, deps, allowDevDeps, node, name) {
  if (importType(name) !== 'external') {
    return
  }
  const packageName = name.split('/')[0]

  if (deps.dependencies[packageName] === undefined) {
    if (!allowDevDeps) {
      context.report(node, devDepErrorMessage(packageName))
    } else if (deps.devDependencies[packageName] === undefined) {
      context.report(node, missingErrorMessage(packageName))
    }
  }
}

module.exports = function (context) {
  const options = context.options[0] || {}
  const allowDevDeps = options.devDependencies !== false
  const deps = getDependencies()

  if (!deps) {
    return {}
  }

  return {
    ImportDeclaration: function (node) {
      reportIfMissing(context, deps, allowDevDeps, node, node.source.value)
    },
    CallExpression: function handleRequires(node) {
      if (isStaticRequire(node)) {
        reportIfMissing(context, deps, allowDevDeps, node, node.arguments[0].value)
      }
    },
  }
}

module.exports.schema = [
  {
    'type': 'object',
    'properties': {
      'devDependencies': { 'type': 'boolean' },
    },
    'additionalProperties': false,
  },
]
