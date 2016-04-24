import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function reportIfMissing(context, node, name) {
  if (importType(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin modules')
  }
}

module.exports = function (context) {
  return {
    ImportDeclaration: function handleImports(node) {
      reportIfMissing(context, node, node.source.value)
    },
    CallExpression: function handleRequires(node) {
      if (isStaticRequire(node)) {
        reportIfMissing(context, node, node.arguments[0].value)
      }
    },
  }
}
