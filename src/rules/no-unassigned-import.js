import isStaticRequire from '../core/staticRequire'
import path from 'path'
import minimatch from 'minimatch'

function report(context, node) {
  context.report({
    node,
    message: 'Imported module should be assigned',
  })
}

function testIsAllow(globs, filename, source) {
  if (!Array.isArray(globs)) {
    return false // default doesn't allow any patterns
  }

  let filePath

  if (source[0] !== '.' && source[0] !== '/') { // a node module
    filePath = source
  } else {
    filePath = path.resolve(path.dirname(filename), source) // get source absolute path
  }

  return globs.find(glob => (
    minimatch(filePath, glob) ||
    minimatch(filePath, path.join(process.cwd(), glob))
  )) !== undefined
}

function create(context) {
  const options = context.options[0] || {}
  const filename = context.getFilename()
  const isAllow = source => testIsAllow(options.allow, filename, source)

  return {
    ImportDeclaration(node) {
      if (node.specifiers.length === 0 && !isAllow(node.source.value)) {
        report(context, node)
      }
    },
    ExpressionStatement(node) {
      if (node.expression.type === 'CallExpression' &&
        isStaticRequire(node.expression) &&
        !isAllow(node.expression.arguments[0].value)) {
        report(context, node.expression)
      }
    },
  }
}

module.exports = {
  create,
  meta: {
    docs: {},
    schema: [
      {
        'type': 'object',
        'properties': {
          'devDependencies': { 'type': ['boolean', 'array'] },
          'optionalDependencies': { 'type': ['boolean', 'array'] },
          'peerDependencies': { 'type': ['boolean', 'array'] },
          'allow': {
            'type': 'array',
            'items': {
              'type': 'string',
            },
          },
        },
        'additionalProperties': false,
      },
    ],
  },
}
