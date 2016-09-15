import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function reportIfMissing(context, node, name) {
  if (importType(name, context) === 'absolute') {
    context.report(node, 'Do not import modules using an absolute path')
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
