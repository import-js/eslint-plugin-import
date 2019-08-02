import resolve from 'eslint-module-utils/resolve'
import docsUrl from '../docsUrl'

function checkImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`
      const [first, ...rest] = nodes
      const sourceCode = context.getSourceCode()
      const fix = getFix(nodes, sourceCode)

      context.report({
        node: first.source,
        message,
        fix, // Attach the autofix (if any) to the first import.
      })

      for (const node of rest) {
        context.report({
          node: node.source,
          message,
        })
      }
    }
  }
}

function getFix(nodes, sourceCode) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined
  }

  // Do not try to fix namespace imports or ones surrounded by comments.
  const fixableNodes = nodes.filter(node =>
    !hasNamespace(node) && !hasProblematicComments(node, sourceCode))

  // Bail if we can not fix anything.
  if (fixableNodes.length <= 1) {
    return undefined
  }

  return fixer => {
    const first = fixableNodes.find(node => node.specifiers.length > 0)

    // If there are no imports with specifiers, keep only first.
    if (!first) {
      return fixableNodes.slice(1).map((node) => fixer.remove(node))
    }

    const rest = fixableNodes.filter(node => node !== first)
    const tokens = sourceCode.getTokens(first)
    const firstDefaultSpecifier = first.specifiers
      .find(specifier => specifier.type === 'ImportDefaultSpecifier')
    const firstNamedSpecifierTexts = new Set(
      first.specifiers
        .filter(specifier => specifier.type === 'ImportSpecifier')
        .map(specifier => sourceCode.getText(specifier))
    )

    let defaultSpecifierText
    let namedSpecifierTexts = new Set()

    rest.forEach((node) => {
      node.specifiers.forEach((specifier) => {
        const specifierText = sourceCode.getText(specifier)

        if (specifier.type === 'ImportSpecifier' && !firstNamedSpecifierTexts.has(specifierText)) {
          namedSpecifierTexts.add(specifierText)
        }

        if (specifier.type === 'ImportDefaultSpecifier') {
          // Imports can't have multiple default specifiers, so we add this as
          // named specifier with alias.
          if (defaultSpecifierText || firstDefaultSpecifier) {
            const namedSpecifierText = `default as ${specifierText}`

            if (!firstNamedSpecifierTexts.has(namedSpecifierText)) {
              namedSpecifierTexts.add(namedSpecifierText)
            }
          } else if (!defaultSpecifierText && !firstDefaultSpecifier) {
            defaultSpecifierText = specifierText
          }
        }
      })
    })

    const fixes = []

    const importToken = tokens.find(token => token.value === 'import')
    const fromToken = tokens.find(token => token.value === 'from')
    const closeBraceToken = tokens.find(token => isPunctuator(token, '}'))

    if (defaultSpecifierText) {
      let text = ` ${defaultSpecifierText}`

      if (closeBraceToken) {
        text = `${text},`
      }

      fixes.push(fixer.insertTextAfter(importToken, text))
    }

    if (namedSpecifierTexts.size > 0) {
      let text = Array.from(namedSpecifierTexts).join(',')

      if (closeBraceToken) {
        const tokenBeforeCloseBrace = sourceCode.getTokenBefore(closeBraceToken)

        // Prepend comma if the last specifier didn't have it, or there are
        // empty braces.
        if (tokenBeforeCloseBrace.value !== '{' && tokenBeforeCloseBrace.value !== ',') {
          text = `,${text}`
        }

        fixes.push(fixer.insertTextBefore(closeBraceToken, text))
      } else {
        // Wrap specifiers in `{`, `}`
        text = `{${text}}`

        // Add after `default` specifier or before `from` token.
        if (firstDefaultSpecifier) {
          // Add coma if there already `import def`.
          text = `,${text}`

          fixes.push(fixer.insertTextAfter(firstDefaultSpecifier, text))
        } else {
          fixes.push(fixer.insertTextBefore(fromToken, text))
        }
      }
    }

    rest.forEach((node) => {
      fixes.push(fixer.remove(node))
    })

    return fixes
  }
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  return node.specifiers
    .some(specifier => specifier.type === 'ImportNamespaceSpecifier')
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentsInside(node, sourceCode)
  )
}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node)
    .some(comment => comment.loc.end.line >= node.loc.start.line - 1)
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node)
    .some(comment => comment.loc.start.line === node.loc.end.line)
}

// Checks whether `node` has any comments _inside_.
function hasCommentsInside(node, sourceCode) {
  const tokens = sourceCode.getTokens(node)

  return tokens.some(token => sourceCode.getCommentsBefore(token).length > 0)
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('no-duplicates'),
    },
    fixable: 'code',
  },

  create: function (context) {
    const imported = new Map()
    const typesImported = new Map()
    return {
      'ImportDeclaration': function (n) {
        // resolved path will cover aliased duplicates
        const resolvedPath = resolve(n.source.value, context) || n.source.value
        const importMap = n.importKind === 'type' ? typesImported : imported

        if (importMap.has(resolvedPath)) {
          importMap.get(resolvedPath).push(n)
        } else {
          importMap.set(resolvedPath, [n])
        }
      },

      'Program:exit': function () {
        checkImports(imported, context)
        checkImports(typesImported, context)
      },
    }
  },
}
