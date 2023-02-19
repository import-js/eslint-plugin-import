import resolve from 'eslint-module-utils/resolve';
import semver from 'semver';
import flatMap from 'array.prototype.flatmap';

import docsUrl from '../docsUrl';

let typescriptPkg;
try {
  typescriptPkg = require('typescript/package.json'); // eslint-disable-line import/no-extraneous-dependencies
} catch (e) { /**/ }

function checkImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`;
      const [first, ...rest] = nodes;
      const sourceCode = context.getSourceCode();
      const fix = getFix(first, rest, sourceCode, context);

      context.report({
        node: first.source,
        message,
        fix, // Attach the autofix (if any) to the first import.
      });

      for (const node of rest) {
        context.report({
          node: node.source,
          message,
        });
      }

    }
  }
}

function checkTypeImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    const typeImports = nodes.filter((node) => node.importKind === 'type');
    if (nodes.length > 1) {
      const someInlineTypeImports = nodes.filter((node) => node.specifiers.some((spec) => spec.importKind === 'type'));
      if (typeImports.length > 0 && someInlineTypeImports.length > 0) {
        const message = `'${module}' imported multiple times.`;
        const sourceCode = context.getSourceCode();
        const fix = getTypeFix(nodes, sourceCode, context);

        const [first, ...rest] = nodes;
        context.report({
          node: first.source,
          message,
          fix, // Attach the autofix (if any) to the first import.
        });

        rest.forEach((node) => {
          context.report({
            node: node.source,
            message,
          });
        });
      }
    }
  }
}

function checkInlineTypeImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`;
      const sourceCode = context.getSourceCode();
      const fix = getInlineTypeFix(nodes, sourceCode);

      const [first, ...rest] = nodes;
      context.report({
        node: first.source,
        message,
        fix, // Attach the autofix (if any) to the first import.
      });

      rest.forEach((node) => {
        context.report({
          node: node.source,
          message,
        });
      });
    }
  }
}

function isComma(token) {
  return token.type === 'Punctuator' && token.value === ',';
}

function getInlineTypeFix(nodes, sourceCode) {
  return fixer => {
    const fixes = [];

    // push to first import
    let [firstImport, ...rest] = nodes;
    // const valueImport = nodes.find((n) => n.specifiers.every((spec) => spec.importKind === 'value')) || nodes.find((n) => n.specifiers.some((spec) => spec.type === 'ImportDefaultSpecifier'));
    const valueImport = nodes.find((n) => n.specifiers.some((spec) => spec.type === 'ImportDefaultSpecifier'));
    if (valueImport) {
      firstImport = valueImport;
      rest = nodes.filter((n) => n !== firstImport);
    }

    const nodeTokens = sourceCode.getTokens(firstImport);
    // we are moving the rest of the Type or Inline Type imports here.
    const nodeClosingBraceIndex = nodeTokens.findIndex(token => isPunctuator(token, '}'));
    const nodeClosingBrace = nodeTokens[nodeClosingBraceIndex];
    const tokenBeforeClosingBrace = nodeTokens[nodeClosingBraceIndex - 1];
    if (nodeClosingBrace) {
      const specifiers = [];
      rest.forEach((node) => {
        // these will be all Type imports, no Value specifiers
        // then add inline type specifiers to importKind === 'type' import
        node.specifiers.forEach((specifier) => {
          if (specifier.importKind === 'type') {
            specifiers.push(`type ${specifier.local.name}`);
          } else {
            specifiers.push(specifier.local.name);
          }
        });

        fixes.push(fixer.remove(node));
      });

      if (isComma(tokenBeforeClosingBrace)) {
        fixes.push(fixer.insertTextBefore(nodeClosingBrace, ` ${specifiers.join(', ')}`));
      } else {
        fixes.push(fixer.insertTextBefore(nodeClosingBrace, `, ${specifiers.join(', ')}`));
      }
    } else {
      // we have a default import only
      const defaultSpecifier = firstImport.specifiers.find((spec) => spec.type === 'ImportDefaultSpecifier');
      const inlineTypeImports = [];
      for (const node of rest) {
        // these will be all Type imports, no Value specifiers
        // then add inline type specifiers to importKind === 'type' import
        for (const specifier of node.specifiers) {
          if (specifier.importKind === 'type') {
            inlineTypeImports.push(`type ${specifier.local.name}`);
          } else {
            inlineTypeImports.push(specifier.local.name);
          }
        }

        fixes.push(fixer.remove(node));
      }

      fixes.push(fixer.insertTextAfter(defaultSpecifier, `, {${inlineTypeImports.join(', ')}}`));
    }

    return fixes;
  };
}

function getTypeFix(nodes, sourceCode, context) {
  return fixer => {
    const fixes = [];

    const preferInline = context.options[0] && context.options[0]['prefer-inline'];

    if (preferInline) {
      if (!semver.satisfies(typescriptPkg.version, '>= 4.5')) {
        throw new Error('Your version of TypeScript does not support inline type imports.');
      }

      // collapse all type imports to the inline type import
      const typeImports = nodes.filter((node) => node.importKind === 'type');
      const someInlineTypeImports = nodes.filter((node) => node.specifiers.some((spec) => spec.importKind === 'type'));
      // push to first import
      const firstImport = someInlineTypeImports[0];

      if (firstImport) {
        const nodeTokens = sourceCode.getTokens(firstImport);
        // we are moving the rest of the Type imports here
        const nodeClosingBrace = nodeTokens.find(token => isPunctuator(token, '}'));

        for (const node of typeImports) {
          for (const specifier of node.specifiers) {
            fixes.push(fixer.insertTextBefore(nodeClosingBrace, `, type ${specifier.local.name}`));
          }

          fixes.push(fixer.remove(node));
        }
      }
    } else {
      // move inline types to type imports
      const typeImports = nodes.filter((node) => node.importKind === 'type');
      const someInlineTypeImports = nodes.filter((node) => node.specifiers.some((spec) => spec.importKind === 'type'));

      const firstImport = typeImports[0];

      if (firstImport) {
        const nodeTokens = sourceCode.getTokens(firstImport);
        // we are moving the rest of the Type imports here
        const nodeClosingBrace = nodeTokens.find(token => isPunctuator(token, '}'));

        for (const node of someInlineTypeImports) {
          for (const specifier of node.specifiers) {
            if (specifier.importKind === 'type') {
              fixes.push(fixer.insertTextBefore(nodeClosingBrace, `, ${specifier.local.name}`));
            }
          }

          if (node.specifiers.every((spec) => spec.importKind === 'type')) {
            fixes.push(fixer.remove(node));
          } else {
            for (const specifier of node.specifiers) {
              if (specifier.importKind === 'type') {
                const maybeComma = sourceCode.getTokenAfter(specifier);
                if (isComma(maybeComma)) {
                  fixes.push(fixer.remove(maybeComma));
                }
                // TODO: remove `type`?
                fixes.push(fixer.remove(specifier));
              }
            }
          }
        }
      }
    }

    return fixes;
  };
}

function getFix(first, rest, sourceCode) {
  // Sorry ESLint <= 3 users, no autofix for you. Autofixing duplicate imports
  // requires multiple `fixer.whatever()` calls in the `fix`: We both need to
  // update the first one, and remove the rest. Support for multiple
  // `fixer.whatever()` in a single `fix` was added in ESLint 4.1.
  // `sourceCode.getCommentsBefore` was added in 4.0, so that's an easy thing to
  // check for.
  if (typeof sourceCode.getCommentsBefore !== 'function') {
    return undefined;
  }

  // Adjusting the first import might make it multiline, which could break
  // `eslint-disable-next-line` comments and similar, so bail if the first
  // import has comments. Also, if the first import is `import * as ns from
  // './foo'` there's nothing we can do.
  if (hasProblematicComments(first, sourceCode) || hasNamespace(first)) {
    return undefined;
  }

  const defaultImportNames = new Set(
    flatMap([].concat(first, rest || []), (x) => getDefaultImportName(x) || []),
  );

  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined;
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  const restWithoutComments = rest.filter((node) => !hasProblematicComments(node, sourceCode) && !hasNamespace(node));

  const specifiers = restWithoutComments
    .map((node) => {
      const tokens = sourceCode.getTokens(node);
      const openBrace = tokens.find((token) => isPunctuator(token, '{'));
      const closeBrace = tokens.find((token) => isPunctuator(token, '}'));

      if (openBrace == null || closeBrace == null) {
        return undefined;
      }

      return {
        importNode: node,
        identifiers: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]).split(','), // Split the text into separate identifiers (retaining any whitespace before or after)
        isEmpty: !hasSpecifiers(node),
      };
    })
    .filter(Boolean);

  const unnecessaryImports = restWithoutComments.filter((node) => !hasSpecifiers(node)
    && !hasNamespace(node)
    && !specifiers.some((specifier) => specifier.importNode === node),
  );

  const shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  const shouldAddSpecifiers = specifiers.length > 0;
  const shouldRemoveUnnecessary = unnecessaryImports.length > 0;

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  return (fixer) => {
    const tokens = sourceCode.getTokens(first);
    const openBrace = tokens.find((token) => isPunctuator(token, '{'));
    const closeBrace = tokens.find((token) => isPunctuator(token, '}'));
    const firstToken = sourceCode.getFirstToken(first);
    const [defaultImportName] = defaultImportNames;

    const firstHasTrailingComma = closeBrace != null && isPunctuator(sourceCode.getTokenBefore(closeBrace), ',');
    const firstIsEmpty = !hasSpecifiers(first);
    const firstExistingIdentifiers = firstIsEmpty
      ? new Set()
      : new Set(sourceCode.text.slice(openBrace.range[1], closeBrace.range[0])
        .split(',')
        .map((x) => x.trim()),
      );

    const [specifiersText] = specifiers.reduce(
      ([result, needsComma, existingIdentifiers], specifier) => {
        // Add *only* the new identifiers that don't already exist, and track any new identifiers so we don't add them again in the next loop
        const [specifierText, updatedExistingIdentifiers] = specifier.identifiers.reduce(([text, set], cur) => {
          const trimmed = cur.trim(); // Trim whitespace before/after to compare to our set of existing identifiers
          if (existingIdentifiers.has(trimmed)) {
            return [text, set];
          }
          return [text.length > 0 ? `${text},${cur}` : cur, set.add(trimmed)];
        }, ['', existingIdentifiers]);

        return [
          needsComma && !specifier.isEmpty && specifierText.length > 0
            ? `${result},${specifierText}`
            : `${result}${specifierText}`,
          specifier.isEmpty ? needsComma : true,
          updatedExistingIdentifiers,
        ];
      },
      ['', !firstHasTrailingComma && !firstIsEmpty, firstExistingIdentifiers],
    );

    const fixes = [];

    if (shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      // `import './foo'` → `import def, {...} from './foo'`
      fixes.push(
        fixer.insertTextAfter(firstToken, ` ${defaultImportName}, {${specifiersText}} from`),
      );
    } else if (shouldAddDefault && openBrace == null && !shouldAddSpecifiers) {
      // `import './foo'` → `import def from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName} from`));
    } else if (shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} from './foo'` → `import def, {...} from './foo'`
      fixes.push(fixer.insertTextAfter(firstToken, ` ${defaultImportName},`));
      if (shouldAddSpecifiers) {
        // `import def, {...} from './foo'` → `import def, {..., ...} from './foo'`
        fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
      }
    } else if (!shouldAddDefault && openBrace == null && shouldAddSpecifiers) {
      if (first.specifiers.length === 0) {
        // `import './foo'` → `import {...} from './foo'`
        fixes.push(fixer.insertTextAfter(firstToken, ` {${specifiersText}} from`));
      } else {
        // `import def from './foo'` → `import def, {...} from './foo'`
        fixes.push(fixer.insertTextAfter(first.specifiers[0], `, {${specifiersText}}`));
      }
    } else if (!shouldAddDefault && openBrace != null && closeBrace != null && specifiersText) {
      // `import {...} './foo'` → `import {..., ...} from './foo'`
      fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
    }

    // Remove imports whose specifiers have been moved into the first import.
    for (const specifier of specifiers) {
      const importNode = specifier.importNode;
      fixes.push(fixer.remove(importNode));

      const charAfterImportRange = [importNode.range[1], importNode.range[1] + 1];
      const charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
      if (charAfterImport === '\n') {
        fixes.push(fixer.removeRange(charAfterImportRange));
      }
    }

    // Remove imports whose default import has been moved to the first import,
    // and side-effect-only imports that are unnecessary due to the first
    // import.
    for (const node of unnecessaryImports) {
      fixes.push(fixer.remove(node));

      const charAfterImportRange = [node.range[1], node.range[1] + 1];
      const charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
      if (charAfterImport === '\n') {
        fixes.push(fixer.removeRange(charAfterImportRange));
      }
    }

    return fixes;
  };
}

function isPunctuator(node, value) {
  return node.type === 'Punctuator' && node.value === value;
}

// Get the name of the default import of `node`, if any.
function getDefaultImportName(node) {
  const defaultSpecifier = node.specifiers
    .find((specifier) => specifier.type === 'ImportDefaultSpecifier');
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined;
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  const specifiers = node.specifiers
    .filter((specifier) => specifier.type === 'ImportNamespaceSpecifier');
  return specifiers.length > 0;
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  const specifiers = node.specifiers
    .filter((specifier) => specifier.type === 'ImportSpecifier');
  return specifiers.length > 0;
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode)
    || hasCommentAfter(node, sourceCode)
    || hasCommentInsideNonSpecifiers(node, sourceCode)
  );
}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node)
    .some((comment) => comment.loc.end.line >= node.loc.start.line - 1);
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node)
    .some((comment) => comment.loc.start.line === node.loc.end.line);
}

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  const tokens = sourceCode.getTokens(node);
  const openBraceIndex = tokens.findIndex((token) => isPunctuator(token, '{'));
  const closeBraceIndex = tokens.findIndex((token) => isPunctuator(token, '}'));
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  const someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0
    ? tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1))
    : tokens.slice(1);
  return someTokens.some((token) => sourceCode.getCommentsBefore(token).length > 0);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Style guide',
      description: 'Forbid repeated import of the same module in multiple places.',
      url: docsUrl('no-duplicates'),
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          considerQueryString: {
            type: 'boolean',
          },
          'prefer-inline': {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    // Prepare the resolver from options.
    const considerQueryStringOption = context.options[0]
      && context.options[0].considerQueryString;
    const defaultResolver = (sourcePath) => resolve(sourcePath, context) || sourcePath;
    const resolver = considerQueryStringOption ? (sourcePath) => {
      const parts = sourcePath.match(/^([^?]*)\?(.*)$/);
      if (!parts) {
        return defaultResolver(sourcePath);
      }
      return `${defaultResolver(parts[1])}?${parts[2]}`;
    } : defaultResolver;

    const moduleMaps = new Map();

    function getImportMap(n) {
      if (!moduleMaps.has(n.parent)) {
        moduleMaps.set(n.parent, {
          imported: new Map(),
          nsImported: new Map(),
          defaultTypesImported: new Map(),
          namedTypesImported: new Map(),
          inlineTypesImported: new Map(),
        });
      }
      const map = moduleMaps.get(n.parent);
      if (n.importKind === 'type') {
        // import type Foo | import type { foo }
        return n.specifiers.length > 0 && n.specifiers[0].type === 'ImportDefaultSpecifier' ? map.defaultTypesImported : map.namedTypesImported;
      }

      if (n.specifiers.some((spec) => spec.importKind === 'type')) {
        // import { type foo }
        return map.inlineTypesImported;
      }

      return hasNamespace(n) ? map.nsImported : map.imported;
    }

    return {
      ImportDeclaration(n) {
        // resolved path will cover aliased duplicates
        const resolvedPath = resolver(n.source.value);
        const importMap = getImportMap(n);

        if (importMap.has(resolvedPath)) {
          importMap.get(resolvedPath).push(n);
        } else {
          importMap.set(resolvedPath, [n]);
        }
      },

      'Program:exit'() {
        for (const map of moduleMaps.values()) {
          checkImports(map.imported, context);
          checkImports(map.nsImported, context);
          checkImports(map.defaultTypesImported, context);
          checkImports(map.namedTypesImported, context);

          const duplicatedImports = new Map(map.inlineTypesImported);
          map.imported.forEach((value, key) => {
            if (duplicatedImports.has(key)) {
              duplicatedImports.get(key).push(...value);
            } else {
              duplicatedImports.set(key, [value]);
            }
          });
          checkInlineTypeImports(duplicatedImports, context);

          const duplicatedTypeImports = new Map(map.inlineTypesImported);
          map.namedTypesImported.forEach((value, key) => {
            if (duplicatedTypeImports.has(key)) {
              duplicatedTypeImports.get(key).push(...value);
            } else {
              duplicatedTypeImports.set(key, value);
            }
          });
          checkTypeImports(duplicatedTypeImports, context);
        }
      },
    };
  },
};
