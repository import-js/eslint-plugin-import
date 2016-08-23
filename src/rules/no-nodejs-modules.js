import importType from '../core/importType'
import isStaticRequire from '../core/staticRequire'

function reportIfMissing(context, node, allowed, name) {
  if (allowed.indexOf(name) === -1 && importType(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin module "' + name + '"')
  }
}

module.exports = function (context) {
  const options = context.options[0] || {}
  const allowed = options.allow || []

  return {
    ImportDeclaration: function handleImports(node) {
      reportIfMissing(context, node, allowed, node.source.value)
    },
    CallExpression: function handleRequires(node) {
      if (isStaticRequire(node)) {
        reportIfMissing(context, node, allowed, node.arguments[0].value)
      }
    },
  }
}
