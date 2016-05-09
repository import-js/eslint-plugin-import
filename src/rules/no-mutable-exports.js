module.exports = function (context) {
  function checkDeclaration(node) {
    const {kind} = node
    if (kind === 'var' || kind === 'let') {
      context.report(node, `Exporting mutable '${kind}' binding, use 'const' instead.`)
    }
  }

  function checkDeclarationsInScope({variables}, name) {
    for (let variable of variables) {
      if (variable.name === name) {
        for (let def of variable.defs) {
          if (def.type === 'Variable') {
            checkDeclaration(def.parent)
          }
        }
      }
    }
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
      for (let specifier of node.specifiers) {
        checkDeclarationsInScope(scope, specifier.local.name)
      }
    }
  }

  return {
    'ExportDefaultDeclaration': handleExportDefault,
    'ExportNamedDeclaration': handleExportNamed,
  }
}
