module.exports = function (context) {
  function checkDeclaration(node) {
    const {kind} = node
    if (kind === 'var' || kind === 'let') {
      context.report(node, `Exporting mutable '${kind}' binding, use 'const' instead.`)
    }
  }

  function handleExportNamed(node) {
    const variables = context.getScope().variables

    if (node.declaration)  {
      checkDeclaration(node.declaration)
    } else {
      node.specifiers.forEach(specifier => {
        variables.forEach(variable => {
          if (variable.name === specifier.local.name) {
            variable.defs.forEach(def => checkDeclaration(def.parent))
          }
        })
      })
    }
  }

  return {
    'ExportNamedDeclaration': handleExportNamed,
  }
}
