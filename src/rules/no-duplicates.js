import resolve from 'eslint-module-utils/resolve'
import docsUrl from '../docsUrl'

function checkImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`
      const [first, ...rest] = nodes
      const sourceCode = context.getSourceCode()
      const fix = getFix(first, rest, sourceCode)

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

function getFix(first, rest, sourceCode) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined
  }

  // Adjusting the first import might make it multiline, which could break
  // `eslint-disable-next-line` comments and similar, so bail if the first
  // import has comments. Also, if the first import is `import * as ns from
  // './foo'` there's nothing we can do.
  if (hasProblematicComments(first, sourceCode) || hasNamespace(first)) {
    return undefined
  }

  const defaultImportNames = new Set(
    [first, ...rest].map(getDefaultImportName).filter(Boolean)
  )

  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  const restWithoutComments = rest.filter(node => !(
    hasProblematicComments(node, sourceCode) ||
    hasNamespace(node)
  ))

  const specifiers = restWithoutComments
    .map(node => {
      const tokens = sourceCode.getTokens(node)
      const openBrace = tokens.find(token => isPunctuator(token, '{'))
      const closeBrace = tokens.find(token => isPunctuator(token, '}'))

      if (openBrace == null || closeBrace == null) {
        return undefined
      }

      return {
        importNode: node,
        text: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]),
        hasTrailingComma: isPunctuator(sourceCode.getTokenBefore(closeBrace), ','),
        isEmpty: !hasSpecifiers(node),
      }
    })
    .filter(Boolean)

  const unnecessaryImports = restWithoutComments.filter(node =>
    !hasSpecifiers(node) &&
    !hasNamespace(node) &&
    !specifiers.some(specifier => specifier.importNode === node)
  )

  const shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1
  const shouldAddSpecifiers = specifiers.length > 0
  const shouldRemoveUnnecessary = unnecessaryImports.length > 0

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined
  }

  return fixer => {
    const tokens = sourceCode.getTokens(first)
    const openBrace = tokens.find(token => isPunctuator(token, '{'))
    const closeBrace = tokens.find(token => isPunctuator(token, '}'))
    const firstToken = sourceCode.getFirstToken(first)
    const [defaultImportName] = defaultImportNames

    const firstHasTrailingComma =
      closeBrace != null &&
      isPunctuator(sourceCode.getTokenBefore(closeBrace), ',')
    const firstIsEmpty = !hasSpecifiers(first)

    const [specifiersText] = specifiers.reduce(
      ([result, needsComma], specifier) => {
        return [
          needsComma && !specifier.isEmpty
            ? `${result},${specifier.text}`
            : `${result}${specifier.text}`,
          specifier.isEmpty ? needsComma : true,
        ]
      },
      ['', !firstHasTrailingComma && !firstIsEmpty]
    )

    const fixes = []

    if (shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      // `import './foo'` → `import def, {...} from './foo'`
      fixes.push(
        fixer.insertTextAfter(firstToken, ` ${defaultImportName}, {${specifiersText}} from`)
      )
    } else if (shouldAddDefault && openBrace == null && !shouldAddSpecifiers) {
      // `import './foo'` → `import def from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName} from`))
    } else if (shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} from './foo'` → `import def, {...} from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName},`))
      if (shouldAddSpecifiers) {
        // `import def, {...} from './foo'` → `import def, {..., ...} from './foo'`
        fixes.push(fixer.insertTextBefore(closeBrace, specifiersText))
      }
    } else if (!shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      // `import './foo'` → `import {...} from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` {${specifiersText}} from`))
    } else if (!shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} './foo'` → `import {..., ...} from './foo'`
      fixes.push(fixer.insertTextBefore(closeBrace, specifiersText))
    }

    // Remove imports whose specifiers have been moved into the first import.
    for (const specifier of specifiers) {
      fixes.push(fixer.remove(specifier.importNode))
    }

    // Remove imports whose default import has been moved to the first import,
    // and side-effect-only imports that are unnecessary due to the first
    // import.
    for (const node of unnecessaryImports) {
      fixes.push(fixer.remove(node))
    }

    return fixes
  }
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value
}

// Get the name of the default import of `node`, if any.
function getDefaultImportName(node) {
  const defaultSpecifier = node.specifiers
    .find(specifier => specifier.type === 'ImportDefaultSpecifier')
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  const specifiers = node.specifiers
    .filter(specifier => specifier.type === 'ImportNamespaceSpecifier')
  return specifiers.length > 0
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  const specifiers = node.specifiers
    .filter(specifier => specifier.type === 'ImportSpecifier')
  return specifiers.length > 0
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentInsideNonSpecifiers(node, sourceCode)
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

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  const tokens = sourceCode.getTokens(node)
  const openBraceIndex = tokens.findIndex(token => isPunctuator(token, '{'))
  const closeBraceIndex = tokens.findIndex(token => isPunctuator(token, '}'))
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  const someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0
    ? tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1))
    : tokens.slice(1)
  return someTokens.some(token => sourceCode.getCommentsBefore(token).length > 0)
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
