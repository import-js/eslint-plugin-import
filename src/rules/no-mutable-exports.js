import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid the use of mutable exports with `var` or `let`.',
      url: docsUrl('no-mutable-exports'),
    },
    schema: [],
  },

  create(context) {
    function checkDeclaration(node) {
      const { kind } = node
      if (kind === 'var' || kind === 'let') {
        context.report(
          node,
          `Exporting mutable '${kind}' binding, use 'const' instead.`,
        )
      }
    }

    function checkDeclarationsInScope({ variables }, name) {
      for (const variable of variables) {
        if (variable.name === name) {
          for (const def of variable.defs) {
            if (def.type === 'Variable' && def.parent) {
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

      if (node.declaration) {
        checkDeclaration(node.declaration)
      } else if (!node.source) {
        for (const specifier of node.specifiers) {
          checkDeclarationsInScope(scope, specifier.local.name)
        }
      }
    }

    return {
      ExportDefaultDeclaration: handleExportDefault,
      ExportNamedDeclaration: handleExportNamed,
    }
  },
}
