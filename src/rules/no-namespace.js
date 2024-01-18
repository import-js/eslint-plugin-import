/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

import minimatch from 'minimatch'
import docsUrl from '../docsUrl'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid namespace (a.k.a. "wildcard" `*`) imports.',
      url: docsUrl('no-namespace'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          ignore: {
            type: 'array',
            items: {
              type: 'string',
            },
            uniqueItems: true,
          },
        },
      },
    ],
  },

  create(context) {
    const firstOption = context.options[0] || {}
    const ignoreGlobs = firstOption.ignore

    return {
      ImportNamespaceSpecifier(node) {
        if (
          ignoreGlobs &&
          ignoreGlobs.find(glob =>
            minimatch(node.parent.source.value, glob, { matchBase: true }),
          )
        ) {
          return
        }

        const scopeVariables = context.getScope().variables
        const namespaceVariable = scopeVariables.find(
          variable => variable.defs[0].node === node,
        )
        const namespaceReferences = namespaceVariable.references
        const namespaceIdentifiers = namespaceReferences.map(
          reference => reference.identifier,
        )
        const canFix =
          namespaceIdentifiers.length > 0 &&
          !usesNamespaceAsObject(namespaceIdentifiers)

        context.report({
          node,
          message: `Unexpected namespace import.`,
          fix:
            canFix &&
            (fixer => {
              const scopeManager = context.getSourceCode().scopeManager
              const fixes = []

              // Pass 1: Collect variable names that are already in scope for each reference we want
              // to transform, so that we can be sure that we choose non-conflicting import names
              const importNameConflicts = {}
              namespaceIdentifiers.forEach(identifier => {
                const parent = identifier.parent
                if (parent && parent.type === 'MemberExpression') {
                  const importName = getMemberPropertyName(parent)
                  const localConflicts = getVariableNamesInScope(
                    scopeManager,
                    parent,
                  )
                  if (!importNameConflicts[importName]) {
                    importNameConflicts[importName] = localConflicts
                  } else {
                    localConflicts.forEach(c =>
                      importNameConflicts[importName].add(c),
                    )
                  }
                }
              })

              // Choose new names for each import
              const importNames = Object.keys(importNameConflicts)
              const importLocalNames = generateLocalNames(
                importNames,
                importNameConflicts,
                namespaceVariable.name,
              )

              // Replace the ImportNamespaceSpecifier with a list of ImportSpecifiers
              const namedImportSpecifiers = importNames.map(importName =>
                importName === importLocalNames[importName]
                  ? importName
                  : `${importName} as ${importLocalNames[importName]}`,
              )
              fixes.push(
                fixer.replaceText(
                  node,
                  `{ ${namedImportSpecifiers.join(', ')} }`,
                ),
              )

              // Pass 2: Replace references to the namespace with references to the named imports
              namespaceIdentifiers.forEach(identifier => {
                const parent = identifier.parent
                if (parent && parent.type === 'MemberExpression') {
                  const importName = getMemberPropertyName(parent)
                  fixes.push(
                    fixer.replaceText(parent, importLocalNames[importName]),
                  )
                }
              })

              return fixes
            }),
        })
      },
    }
  },
}

/**
 * @param {Identifier[]} namespaceIdentifiers
 * @returns {boolean} `true` if the namespace variable is more than just a glorified constant
 */
function usesNamespaceAsObject(namespaceIdentifiers) {
  return !namespaceIdentifiers.every(identifier => {
    const parent = identifier.parent

    // `namespace.x` or `namespace['x']`
    return (
      parent &&
      parent.type === 'MemberExpression' &&
      (parent.property.type === 'Identifier' ||
        parent.property.type === 'Literal')
    )
  })
}

/**
 * @param {MemberExpression} memberExpression
 * @returns {string} the name of the member in the object expression, e.g. the `x` in `namespace.x`
 */
function getMemberPropertyName(memberExpression) {
  return memberExpression.property.type === 'Identifier'
    ? memberExpression.property.name
    : memberExpression.property.value
}

/**
 * @param {ScopeManager} scopeManager
 * @param {ASTNode} node
 * @return {Set<string>}
 */
function getVariableNamesInScope(scopeManager, node) {
  let currentNode = node
  let scope = scopeManager.acquire(currentNode)
  while (scope == null) {
    currentNode = currentNode.parent
    scope = scopeManager.acquire(currentNode, true)
  }
  return new Set(
    scope.variables
      .concat(scope.upper.variables)
      .map(variable => variable.name),
  )
}

/**
 *
 * @param {*} names
 * @param {*} nameConflicts
 * @param {*} namespaceName
 */
function generateLocalNames(names, nameConflicts, namespaceName) {
  const localNames = {}
  names.forEach(name => {
    let localName
    if (!nameConflicts[name].has(name)) {
      localName = name
    } else if (!nameConflicts[name].has(`${namespaceName}_${name}`)) {
      localName = `${namespaceName}_${name}`
    } else {
      for (let i = 1; i < Infinity; i++) {
        if (!nameConflicts[name].has(`${namespaceName}_${name}_${i}`)) {
          localName = `${namespaceName}_${name}_${i}`
          break
        }
      }
    }
    localNames[name] = localName
  })
  return localNames
}
