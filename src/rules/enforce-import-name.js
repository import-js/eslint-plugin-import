/**
 * @fileoverview Rule to enforce aliases for default imports
 * @author Michał Kołodziejski
 */

import docsUrl from '../docsUrl'
import has from 'has'


function isDefaultImport(specifier) {
  if (specifier.type === 'ImportDefaultSpecifier') {
    return true
  }
  if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'default') {
    return true
  }
  return false
}

function isCommonJSImport(declaration) {
  const variableInit = declaration.init
  if (variableInit.type === 'CallExpression') {
    return variableInit.callee.name === 'require'
  }
  return false
}

function handleImport(
  context,
  node,
  specifierOrDeclaration,
  packageName,
  importAlias,
  exportedIdentifiers
) {
  const mappings = context.options[0] || {}

  if (!has(mappings, packageName) || mappings[packageName] === importAlias) {
    return
  }

  let declaredVariables
  if (specifierOrDeclaration.type === 'VariableDeclarator') {
    declaredVariables = context.getDeclaredVariables(specifierOrDeclaration.parent)[0]
  } else {
    declaredVariables = context.getDeclaredVariables(specifierOrDeclaration)[0]
  }

  const references = declaredVariables ? declaredVariables.references : []
  const skipFixing = exportedIdentifiers.indexOf(importAlias) !== -1

  context.report({
    node: node,
    message: `Default import from '${packageName}' should be aliased to `
            + `${mappings[packageName]}, not ${importAlias}`,
    fix: skipFixing ? null : fixImportOrRequire(specifierOrDeclaration, mappings[packageName]),
  })

  for (const variableReference of references) {
    if (specifierOrDeclaration.type === 'VariableDeclarator' && variableReference.init) {
      continue
    }

    context.report({
      node: variableReference.identifier,
      message: `Using incorrect binding name '${variableReference.identifier.name}' `
              + `instead of ${mappings[packageName]} for `
              + `default import from package ${packageName}`,
      fix: fixer => {
        if (skipFixing) {
          return
        }

        return fixer.replaceText(variableReference.identifier, mappings[packageName])
      },
    })
  }
}

function fixImportOrRequire(node, text) {
  return function(fixer) {
    let newAlias = text
    let nodeOrToken
    if (node.type === 'VariableDeclarator') {
      nodeOrToken = node.id
      newAlias = text
    } else {
      nodeOrToken = node
      if (node.imported && node.imported.name === 'default') {
        newAlias = `default as ${text}`
      } else {
        newAlias = text
      }
    }

    return fixer.replaceText(nodeOrToken, newAlias)
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('enforce-import-name'),
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        minProperties: 1,
        additionalProperties: {
          type: 'string',
        },
      },
    ],
  },
  create: function(context) {
    const exportedIdentifiers = []
    return {
      'Program': function(programNode) {
        const {body} = programNode

        body.forEach((node) => {
          if (node.type === 'ExportNamedDeclaration') {
            node.specifiers.forEach((specifier) => {
              const {exported: {name}} = specifier
              if (exportedIdentifiers.indexOf(name) === -1) {
                exportedIdentifiers.push(name)
              }
            })
          }
        })
      },
      'ImportDeclaration:exit': function(node) {
        const {source, specifiers} = node
        const {options} = context

        if (options.length === 0) {
          return
        }

        for (const specifier of specifiers) {
          if (!isDefaultImport(specifier)) {
            continue
          }

          handleImport(
            context,
            source,
            specifier,
            source.value,
            specifier.local.name,
            exportedIdentifiers
          )
        }
      },
      'VariableDeclaration:exit': function(node) {
        const {declarations} = node
        const {options} = context

        if (options.length === 0) {
          return
        }

        for (const declaration of declarations) {
          if (!isCommonJSImport(declaration) || context.getScope(declaration).type !== 'module') {
            continue
          }

          handleImport(
            context,
            node,
            declaration,
            declaration.init.arguments[0].value,
            declaration.id.name,
            exportedIdentifiers
          )
        }
      },
    }
  },
}
