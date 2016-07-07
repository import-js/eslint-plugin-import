module.exports = function (context) {
  function checkDeclaration(node) {
    const {kind} = node
    if (kind === 'var' || kind === 'let') {
      context.report(node, `Exporting mutable '${kind}' binding, use 'const' instead.`)
    }
  }

  function checkDeclarationsInScope({variables}, name) {
    variables.forEach((variable) => {
      if (variable.name === name) {
        variable.defs.forEach((def) => {
          if (def.type === 'Variable') {
            checkDeclaration(def.parent)
          }
        })
      }
    })
  }

  function handleExportDefault(node) {
    const scope = context.getScope()

    if (node.declaration.name) {
      checkDeclarationsInScope(scope, node.declaration.name)
    }
  }

  function handleExportNamed(node) {
    const scope = context.getScope()

    if (node.declaration)  {
      checkDeclaration(node.declaration)
    } else if (!node.source) {
      node.specifiers.forEach((specifier) => {
        checkDeclarationsInScope(scope, specifier.local.name)
      })
    }
  }

  return {
    'ExportDefaultDeclaration': handleExportDefault,
    'ExportNamedDeclaration': handleExportNamed,
  }
}
