module.exports = function (context) {
  return {
    'ExportNamedDeclaration': function (node) {
      const kind = node.declaration.kind
      if (kind === 'var' || kind === 'let') {
        context.report(node, `Exporting mutable '${kind}' binding, use const instead.`)
      }
    },
  }
}
