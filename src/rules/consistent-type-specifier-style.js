import docsUrl from '../docsUrl'

function isComma(token) {
  return token.type === 'Punctuator' && token.value === ','
}

function removeSpecifiers(fixes, fixer, sourceCode, specifiers) {
  for (const specifier of specifiers) {
    // remove the trailing comma
    const token = sourceCode.getTokenAfter(specifier)
    if (token && isComma(token)) {
      fixes.push(fixer.remove(token))
    }
    fixes.push(fixer.remove(specifier))
  }
}

function getImportText(node, sourceCode, specifiers, kind) {
  const sourceString = sourceCode.getText(node.source)
  if (specifiers.length === 0) {
    return ''
  }

  const names = specifiers.map(s => {
    if (s.imported.name === s.local.name) {
      return s.imported.name
    }
    return `${s.imported.name} as ${s.local.name}`
  })
  // insert a fresh top-level import
  return `import ${kind} {${names.join(', ')}} from ${sourceString};`
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description:
        'Enforce or ban the use of inline type-only markers for named imports.',
      url: docsUrl('consistent-type-specifier-style'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'string',
        enum: ['prefer-inline', 'prefer-top-level'],
        default: 'prefer-inline',
      },
    ],
  },

  create(context) {
    const sourceCode = context.getSourceCode()

    if (context.options[0] === 'prefer-inline') {
      return {
        ImportDeclaration(node) {
          if (node.importKind === 'value' || node.importKind == null) {
            // top-level value / unknown is valid
            return
          }

          if (
            // no specifiers (import type {} from '') have no specifiers to mark as inline
            node.specifiers.length === 0 ||
            (node.specifiers.length === 1 &&
              // default imports are both "inline" and "top-level"
              (node.specifiers[0].type === 'ImportDefaultSpecifier' ||
                // namespace imports are both "inline" and "top-level"
                node.specifiers[0].type === 'ImportNamespaceSpecifier'))
          ) {
            return
          }

          context.report({
            node,
            message:
              'Prefer using inline {{kind}} specifiers instead of a top-level {{kind}}-only import.',
            data: {
              kind: node.importKind,
            },
            fix(fixer) {
              const kindToken = sourceCode.getFirstToken(node, { skip: 1 })

              return [].concat(
                kindToken ? fixer.remove(kindToken) : [],
                node.specifiers.map(specifier =>
                  fixer.insertTextBefore(specifier, `${node.importKind} `),
                ),
              )
            },
          })
        },
      }
    }

    // prefer-top-level
    return {
      ImportDeclaration(node) {
        if (
          // already top-level is valid
          node.importKind === 'type' ||
          node.importKind === 'typeof' ||
          // no specifiers (import {} from '') cannot have inline - so is valid
          node.specifiers.length === 0 ||
          (node.specifiers.length === 1 &&
            // default imports are both "inline" and "top-level"
            (node.specifiers[0].type === 'ImportDefaultSpecifier' ||
              // namespace imports are both "inline" and "top-level"
              node.specifiers[0].type === 'ImportNamespaceSpecifier'))
        ) {
          return
        }

        const typeSpecifiers = []
        const typeofSpecifiers = []
        const valueSpecifiers = []
        let defaultSpecifier = null
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            defaultSpecifier = specifier
            continue
          }

          if (specifier.importKind === 'type') {
            typeSpecifiers.push(specifier)
          } else if (specifier.importKind === 'typeof') {
            typeofSpecifiers.push(specifier)
          } else if (
            specifier.importKind === 'value' ||
            specifier.importKind == null
          ) {
            valueSpecifiers.push(specifier)
          }
        }

        const typeImport = getImportText(
          node,
          sourceCode,
          typeSpecifiers,
          'type',
        )
        const typeofImport = getImportText(
          node,
          sourceCode,
          typeofSpecifiers,
          'typeof',
        )
        const newImports = `${typeImport}\n${typeofImport}`.trim()

        if (
          typeSpecifiers.length + typeofSpecifiers.length ===
          node.specifiers.length
        ) {
          // all specifiers have inline specifiers - so we replace the entire import
          const kind = [].concat(
            typeSpecifiers.length > 0 ? 'type' : [],
            typeofSpecifiers.length > 0 ? 'typeof' : [],
          )

          context.report({
            node,
            message:
              'Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers.',
            data: {
              kind: kind.join('/'),
            },
            fix(fixer) {
              return fixer.replaceText(node, newImports)
            },
          })
        } else {
          // remove specific specifiers and insert new imports for them
          for (const specifier of typeSpecifiers.concat(typeofSpecifiers)) {
            context.report({
              node: specifier,
              message:
                'Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers.',
              data: {
                kind: specifier.importKind,
              },
              fix(fixer) {
                const fixes = []

                // if there are no value specifiers, then the other report fixer will be called, not this one

                if (valueSpecifiers.length > 0) {
                  // import { Value, type Type } from 'mod';

                  // we can just remove the type specifiers
                  removeSpecifiers(fixes, fixer, sourceCode, typeSpecifiers)
                  removeSpecifiers(fixes, fixer, sourceCode, typeofSpecifiers)

                  // make the import nicely formatted by also removing the trailing comma after the last value import
                  // eg
                  // import { Value, type Type } from 'mod';
                  // to
                  // import { Value  } from 'mod';
                  // not
                  // import { Value,  } from 'mod';
                  const maybeComma = sourceCode.getTokenAfter(
                    valueSpecifiers[valueSpecifiers.length - 1],
                  )
                  if (isComma(maybeComma)) {
                    fixes.push(fixer.remove(maybeComma))
                  }
                } else if (defaultSpecifier) {
                  // import Default, { type Type } from 'mod';

                  // remove the entire curly block so we don't leave an empty one behind
                  // NOTE - the default specifier *must* be the first specifier always!
                  //        so a comma exists that we also have to clean up or else it's bad syntax
                  const comma = sourceCode.getTokenAfter(
                    defaultSpecifier,
                    isComma,
                  )
                  const closingBrace = sourceCode.getTokenAfter(
                    node.specifiers[node.specifiers.length - 1],
                    token => token.type === 'Punctuator' && token.value === '}',
                  )
                  fixes.push(
                    fixer.removeRange([comma.range[0], closingBrace.range[1]]),
                  )
                }

                return fixes.concat(
                  // insert the new imports after the old declaration
                  fixer.insertTextAfter(node, `\n${newImports}`),
                )
              },
            })
          }
        }
      },
    }
  },
}
