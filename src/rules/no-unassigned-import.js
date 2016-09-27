import isStaticRequire from '../core/staticRequire'

function report(context, node) {
  context.report({
    node,
    message: 'Imported module should be assigned',
  })
}

function create(context) {
  return {
    ImportDeclaration(node) {
      if (node.specifiers.length === 0) {
        report(context, node)
      }
    },
    ExpressionStatement(node) {
      if (node.expression.type === 'CallExpression' && isStaticRequire(node.expression)) {
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
        },
        'additionalProperties': false,
      },
    ],
  },
}
