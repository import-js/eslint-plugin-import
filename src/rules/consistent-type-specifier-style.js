import { getSourceCode } from 'eslint-module-utils/contextCompat';

import docsUrl from '../docsUrl';

function isComma(token) {
  return token.type === 'Punctuator' && token.value === ',';
}

/**
 * @param {import('eslint').Rule.Fix[]} fixes
 * @param {import('eslint').Rule.RuleFixer} fixer
 * @param {import('eslint').SourceCode.SourceCode} sourceCode
 * @param {(ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ExportSpecifier)[]} specifiers
 * */
function removeSpecifiers(fixes, fixer, sourceCode, specifiers) {
  for (const specifier of specifiers) {
    // remove the trailing comma
    const token = sourceCode.getTokenAfter(specifier);
    if (token && isComma(token)) {
      fixes.push(fixer.remove(token));
    }
    fixes.push(fixer.remove(specifier));
  }
}

/**
 * @param {import('eslint').Rule.RuleFixer} fixer
 * @param {import('eslint').SourceCode.SourceCode} sourceCode
 * @param {import('eslint').AST.Token} kindToken
 */
function removeKindToken(fixer, sourceCode, kindToken) {
  const trailingCharacter = sourceCode.text[kindToken.range[1]];
  const end = trailingCharacter && (/\s/).test(trailingCharacter)
    ? kindToken.range[1] + 1
    : kindToken.range[1];
  return fixer.removeRange([kindToken.range[0], end]);
}

/**
 * Comments may describe the type specifier being extracted. Splitting the
 * export cannot safely determine whether to move or retain those comments.
 * @param {import('eslint').SourceCode.SourceCode} sourceCode
 * @param {ExportSpecifier[]} specifiers
 */
function hasSpecifierComments(sourceCode, specifiers) {
  // `getCommentsBefore` was added in ESLint 4. Avoid an unsafe fix when the
  // installed ESLint cannot provide the comment ownership information.
  if (
    typeof sourceCode.getCommentsBefore !== 'function'
    || typeof sourceCode.getCommentsAfter !== 'function'
  ) {
    return true;
  }
  return specifiers.some((specifier) => sourceCode.getCommentsBefore(specifier).length > 0
    || sourceCode.getCommentsAfter(specifier).length > 0);
}

/** @type {(node: import('estree').Node, sourceCode: import('eslint').SourceCode.SourceCode, specifiers: (ImportSpecifier | ImportNamespaceSpecifier)[], kind: 'type' | 'typeof') => string} */
function getImportText(
  node,
  sourceCode,
  specifiers,
  kind,
) {
  const sourceString = sourceCode.getText(node.source);
  if (specifiers.length === 0) {
    return '';
  }

  const names = specifiers.map((s) => {
    if (s.imported.name === s.local.name) {
      return s.imported.name;
    }
    return `${s.imported.name} as ${s.local.name}`;
  });
  // insert a fresh top-level import
  return `import ${kind} {${names.join(', ')}} from ${sourceString};`;
}

/** @type {(node: import('estree').ExportNamedDeclaration, sourceCode: import('eslint').SourceCode.SourceCode, specifiers: ExportSpecifier[]) => string} */
function getExportText(
  node,
  sourceCode,
  specifiers,
) {
  const names = specifiers.map((specifier) => {
    const kindToken = sourceCode.getFirstToken(specifier);
    return sourceCode.text.slice(kindToken.range[1], specifier.range[1]).replace(/^\s+/, '');
  });
  const closingBrace = sourceCode.getTokenAfter(
    node.specifiers[node.specifiers.length - 1],
    (token) => token.type === 'Punctuator' && token.value === '}',
  );
  const suffix = sourceCode.text.slice(closingBrace.range[1], node.range[1]);
  return `export type {${names.join(', ')}}${suffix}`;
}

/**
 * Flow supports top-level type exports but not inline type export specifiers.
 * TypeScript-ESTree identifies its export specifiers with an `exportKind`.
 * @param {import('estree').ExportNamedDeclaration} node
 */
function isTypeScriptExport(node) {
  return node.specifiers.length > 0
    && node.specifiers.every((specifier) => specifier.exportKind === 'type' || specifier.exportKind === 'value');
}

/** @param {import('estree').ExportNamedDeclaration} node */
function hasExportAttributes(node) {
  return node.assertions && node.assertions.length > 0
    || node.attributes && node.attributes.length > 0;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Enforce or ban the use of inline type-only markers for named imports and exports.',
      url: docsUrl('consistent-type-specifier-style'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'string',
        enum: [
          'prefer-inline',
          'prefer-top-level',
          'prefer-top-level-if-only-type-imports',
        ],
        default: 'prefer-inline',
      },
    ],
  },

  create(context) {
    const sourceCode = getSourceCode(context);
    const preference = context.options[0] || 'prefer-inline';

    if (preference === 'prefer-inline') {
      return {
        ImportDeclaration(node) {
          if (node.importKind === 'value' || node.importKind == null) {
            // top-level value / unknown is valid
            return;
          }

          if (
            // no specifiers (import type {} from '') have no specifiers to mark as inline
            node.specifiers.length === 0
            || node.specifiers.length === 1
            // default imports are both "inline" and "top-level"
            && (
              node.specifiers[0].type === 'ImportDefaultSpecifier'
              // namespace imports are both "inline" and "top-level"
              || node.specifiers[0].type === 'ImportNamespaceSpecifier'
            )
          ) {
            return;
          }

          context.report({
            node,
            message: 'Prefer using inline {{kind}} specifiers instead of a top-level {{kind}}-only import.',
            data: {
              kind: node.importKind,
            },
            fix(fixer) {
              const kindToken = sourceCode.getFirstToken(node, { skip: 1 });

              return [].concat(
                kindToken ? fixer.remove(kindToken) : [],
                node.specifiers.map((specifier) => fixer.insertTextBefore(specifier, `${node.importKind} `)),
              );
            },
          });
        },
        ExportNamedDeclaration(node) {
          if (!isTypeScriptExport(node) || node.exportKind !== 'type') {
            return;
          }

          context.report({
            node,
            message: 'Prefer using inline type specifiers instead of a top-level type-only export.',
            fix(fixer) {
              if (hasExportAttributes(node)) {
                return null;
              }

              const kindToken = sourceCode.getFirstToken(node, { skip: 1 });

              return [].concat(
                kindToken ? removeKindToken(fixer, sourceCode, kindToken) : [],
                node.specifiers.map((specifier) => fixer.insertTextBefore(specifier, 'type ')),
              );
            },
          });
        },
      };
    }

    // prefer-top-level or prefer-top-level-if-only-type-imports
    return {
      /** @param {import('estree').ImportDeclaration} node */
      ImportDeclaration(node) {
        if (
          // already top-level is valid
          node.importKind === 'type'
          || node.importKind === 'typeof'
          // no specifiers (import {} from '') cannot have inline - so is valid
          || node.specifiers.length === 0
          || node.specifiers.length === 1
          // default imports are both "inline" and "top-level"
          && (
            node.specifiers[0].type === 'ImportDefaultSpecifier'
            // namespace imports are both "inline" and "top-level"
            || node.specifiers[0].type === 'ImportNamespaceSpecifier'
          )
        ) {
          return;
        }

        /** @type {typeof node.specifiers} */
        const typeSpecifiers = [];
        /** @type {typeof node.specifiers} */
        const typeofSpecifiers = [];
        /** @type {typeof node.specifiers} */
        const valueSpecifiers = [];
        /** @type {typeof node.specifiers[number]} */
        let defaultSpecifier = null;
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            defaultSpecifier = specifier;
            continue;
          }

          if (specifier.importKind === 'type') {
            typeSpecifiers.push(specifier);
          } else if (specifier.importKind === 'typeof') {
            typeofSpecifiers.push(specifier);
          } else if (specifier.importKind === 'value' || specifier.importKind == null) {
            valueSpecifiers.push(specifier);
          }
        }

        const typeImport = getImportText(node, sourceCode, typeSpecifiers, 'type');
        const typeofImport = getImportText(node, sourceCode, typeofSpecifiers, 'typeof');
        const newImports = `${typeImport}\n${typeofImport}`.trim();

        if (typeSpecifiers.length + typeofSpecifiers.length === node.specifiers.length) {
          /** @type {('type' | 'typeof')[]} */
          // all specifiers have inline specifiers - so we replace the entire import
          const kind = [].concat(
            typeSpecifiers.length > 0 ? 'type' : [],
            typeofSpecifiers.length > 0 ? 'typeof' : [],
          );

          const messageSuffix = preference === 'prefer-top-level-if-only-type-imports' ? ' when there are only type imports' : '';
          context.report({
            node,
            message: `Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers${messageSuffix}.`,
            data: {
              kind: kind.join('/'),
            },
            fix(fixer) {
              return fixer.replaceText(node, newImports);
            },
          });
        } else if (preference !== 'prefer-top-level-if-only-type-imports') {
          // remove specific specifiers and insert new imports for them
          typeSpecifiers.concat(typeofSpecifiers).forEach((specifier) => {
            context.report({
              node: specifier,
              message: 'Prefer using a top-level {{kind}}-only import instead of inline {{kind}} specifiers.',
              data: {
                kind: specifier.importKind,
              },
              fix(fixer) {
                /** @type {import('eslint').Rule.Fix[]} */
                const fixes = [];

                // if there are no value specifiers, then the other report fixer will be called, not this one

                if (valueSpecifiers.length > 0) {
                  // import { Value, type Type } from 'mod';

                  // we can just remove the type specifiers
                  removeSpecifiers(fixes, fixer, sourceCode, typeSpecifiers);
                  removeSpecifiers(fixes, fixer, sourceCode, typeofSpecifiers);

                  // make the import nicely formatted by also removing the trailing comma after the last value import
                  // eg
                  // import { Value, type Type } from 'mod';
                  // to
                  // import { Value  } from 'mod';
                  // not
                  // import { Value,  } from 'mod';
                  const maybeComma = sourceCode.getTokenAfter(valueSpecifiers[valueSpecifiers.length - 1]);
                  if (isComma(maybeComma)) {
                    fixes.push(fixer.remove(maybeComma));
                  }
                } else if (defaultSpecifier) {
                  // import Default, { type Type } from 'mod';

                  // remove the entire curly block so we don't leave an empty one behind
                  // NOTE - the default specifier *must* be the first specifier always!
                  //        so a comma exists that we also have to clean up or else it's bad syntax
                  const comma = sourceCode.getTokenAfter(defaultSpecifier, isComma);
                  const closingBrace = sourceCode.getTokenAfter(
                    node.specifiers[node.specifiers.length - 1],
                    (token) => token.type === 'Punctuator' && token.value === '}',
                  );
                  fixes.push(fixer.removeRange([
                    comma.range[0],
                    closingBrace.range[1],
                  ]));
                }

                return fixes.concat(
                  // insert the new imports after the old declaration
                  fixer.insertTextAfter(node, `\n${newImports}`),
                );
              },
            });
          });
        }
      },
      /** @param {import('estree').ExportNamedDeclaration} node */
      ExportNamedDeclaration(node) {
        if (
          !isTypeScriptExport(node)
          // already top-level is valid
          || node.exportKind === 'type'
        ) {
          return;
        }

        /** @type {ExportSpecifier[]} */
        const typeSpecifiers = [];
        /** @type {ExportSpecifier[]} */
        const valueSpecifiers = [];
        for (const specifier of node.specifiers) {
          if (specifier.exportKind === 'type') {
            typeSpecifiers.push(specifier);
          } else {
            valueSpecifiers.push(specifier);
          }
        }

        if (typeSpecifiers.length === 0) {
          return;
        }

        const typeExport = getExportText(node, sourceCode, typeSpecifiers);

        if (typeSpecifiers.length === node.specifiers.length) {
          const messageSuffix = preference === 'prefer-top-level-if-only-type-imports' ? ' when there are only type exports' : '';
          context.report({
            node,
            message: `Prefer using a top-level type-only export instead of inline type specifiers${messageSuffix}.`,
            fix(fixer) {
              if (hasExportAttributes(node)) {
                return null;
              }

              const exportToken = sourceCode.getFirstToken(node);
              return [].concat(
                fixer.insertTextAfter(exportToken, ' type'),
                typeSpecifiers.map((specifier) => {
                  const kindToken = sourceCode.getFirstToken(specifier);
                  return removeKindToken(fixer, sourceCode, kindToken);
                }),
              );
            },
          });
        } else if (preference !== 'prefer-top-level-if-only-type-imports') {
          typeSpecifiers.forEach((specifier) => {
            context.report({
              node: specifier,
              message: 'Prefer using a top-level type-only export instead of inline type specifiers.',
              fix(fixer) {
                if (hasExportAttributes(node) || hasSpecifierComments(sourceCode, typeSpecifiers)) {
                  return null;
                }

                /** @type {import('eslint').Rule.Fix[]} */
                const fixes = [];

                removeSpecifiers(fixes, fixer, sourceCode, typeSpecifiers);

                // Remove the trailing comma after the last value export so the
                // original declaration does not retain an empty final slot.
                const maybeComma = sourceCode.getTokenAfter(valueSpecifiers[valueSpecifiers.length - 1]);
                if (isComma(maybeComma)) {
                  fixes.push(fixer.remove(maybeComma));
                }

                return fixes.concat(
                  fixer.insertTextAfter(node, `\n${typeExport}`),
                );
              },
            });
          });
        }
      },
    };
  },
};
