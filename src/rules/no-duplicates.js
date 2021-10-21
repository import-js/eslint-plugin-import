import resolve from 'eslint-module-utils/resolve';
import docsUrl from '../docsUrl';
import { arrayFlat } from '../core/utils/array';

/**
 * returns either `import` or `type` token, as in
 *
 * import { useState } from 'react'
 * or
 * import type { FC } from 'react'
 */
function getFirstStaticToken(tokens) {
  const firstToken = tokens[0];
  const secondToken = tokens[1];

  if (secondToken && secondToken.value === 'type') {
    return secondToken;
  }

  return firstToken;
}

/**
 * return the import path token, e.g. 'react' as in
 *
 * import { useState } from 'react'
 * or
 * import { useState } from 'react';
 */
function getLastStaticToken(tokens) {
  const lastToken = tokens[tokens.length - 1];

  if (isPunctuator(lastToken, ';')) {
    return tokens[tokens.length - 2];
  }

  return lastToken;
}

/**
 * Merges specifiers together to one statement and sorts them alphabetically
 *
 * @returns e.g. `{ useState, useEffect, FC }`
 */
function getNamedSpecifiersText(specifiers) {
  const specifierInfos = specifiers
    .filter(info => info && !info.isEmpty);

  const setOfSpecifiers = new Set(
    arrayFlat(
      specifierInfos
        .map(info => info.text)
        .map(text => text.split(',')),
    )
      .map(specifier => specifier.trim())
      .filter(Boolean),
  );

  let specifiersText = Array.from(setOfSpecifiers.values())
    .sort()
    .join(', ');


  if (specifiersText.length > 0) {
    specifiersText = `{ ${specifiersText} }`;
  }

  return specifiersText;
}

/**
 * Generates fix commands to create a new import statement including
 * all import specifiers if any, plus the default import specifier if any.
 *
 * This is extra useful for users that want to resolve a merge conflict
 * of imports. Now they can use `Accept both` and let this rule merge all
 * these imports for them thanks to auto-fix.
 *
 * Does not support mixing specifiers and comments
 *
 * e.g. import {
 *    useState, // I like this hook
 *    useEffect,
 * } from 'react'
 *
 * Lines like this will not get an auto-fix
 */
function generateFixCommandsToMergeImportsIntoTheFirstOne(args) {
  const {
    specifiers,
    defaultImportName,
    fixer,
    firstStaticToken,
    lastStaticToken,
  } = args;

  /**
   * e.g. `React, { useState }`
   */
  const specifiersText = [defaultImportName, getNamedSpecifiersText(specifiers)]
    .filter(item => item && item.length > 0)
    .join(', ');

  if (specifiersText.length === 0) {
    // no fixes
    return [];
  }

  /**
   * e.g. ` React, { useState } from `
   */
  const fixText = ` ${specifiersText} from `;

  /**
   * This is the range of the specifiers text of the first import line
   * e.g. if the first import line is
   *
   * import { xxx } from 'hello'
   *
   * Then this range is the range of this text: ` { xxx } `
   */
  const specifiersTextRangeOfFirstImportStatement = [
    firstStaticToken.range[1],
    lastStaticToken.range[0],
  ];

  return [
    fixer.removeRange(specifiersTextRangeOfFirstImportStatement),
    fixer.insertTextAfter(firstStaticToken, fixText),
  ];
}

function checkImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`;
      const [first, ...rest] = nodes;
      const sourceCode = context.getSourceCode();
      const fix = getFix(first, rest, sourceCode);

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

function hasInlineComment(info) {
  return info ? info.text.includes('/') : false;
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
    [first, ...rest].map(getDefaultImportName).filter(Boolean),
  );

  // Bail if there are multiple different default import names – it's up to the
  // user to choose which one to keep.
  if (defaultImportNames.size > 1) {
    return undefined;
  }

  // Leave it to the user to handle comments. Also skip `import * as ns from
  // './foo'` imports, since they cannot be merged into another import.
  const restWithoutComments = rest.filter(node => !(
    hasProblematicComments(node, sourceCode) ||
    hasNamespace(node)
  ));

  function getSpecifierInfo(node) {
    const tokens = sourceCode.getTokens(node);
    const openBrace = tokens.find(token => isPunctuator(token, '{'));
    const closeBrace = tokens.find(token => isPunctuator(token, '}'));

    if (openBrace == null || closeBrace == null) {
      return undefined;
    }

    return {
      importNode: node,
      text: sourceCode.text.slice(openBrace.range[1], closeBrace.range[0]),
      hasTrailingComma: isPunctuator(sourceCode.getTokenBefore(closeBrace), ','),
      isEmpty: !hasSpecifiers(node),
    };
  }

  const specifiers = restWithoutComments
    .map(getSpecifierInfo)
    .filter(Boolean);

  const unnecessaryImports = restWithoutComments.filter(node =>
    !hasSpecifiers(node) &&
    !hasNamespace(node) &&
    !specifiers.some(specifier => specifier.importNode === node),
  );

  const shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  const shouldAddSpecifiers = specifiers.length > 0;
  const shouldRemoveUnnecessary = unnecessaryImports.length > 0;

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  return fixer => {
    const tokens = sourceCode.getTokens(first);
    const firstStaticToken = getFirstStaticToken(tokens);
    const lastStaticToken = getLastStaticToken(tokens);

    const [defaultImportName] = defaultImportNames;
    const firstSpecifier = getSpecifierInfo(first);

    if (hasInlineComment(firstSpecifier)) {
      return [];
    }

    const specifiersWithoutInlineComments = specifiers
      .filter(info => !hasInlineComment(info));

    const fixes = [];

    if (shouldAddDefault || shouldAddSpecifiers) {
      generateFixCommandsToMergeImportsIntoTheFirstOne({
        specifiers: [...specifiersWithoutInlineComments, firstSpecifier],
        defaultImportName,
        fixer,
        firstStaticToken,
        lastStaticToken,
      }).forEach(fix => fixes.push(fix));
    }

    // Remove imports whose specifiers have been moved into the first import.
    for (const specifier of specifiersWithoutInlineComments) {
      const importNode = specifier.importNode;
      fixes.push(fixer.remove(importNode));

      const charAfterImportRange = [importNode.range[1], importNode.range[1] + 1];
      const charAfterImport = sourceCode.text.substring(
        charAfterImportRange[0],
        charAfterImportRange[1],
      );

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
      const charAfterImport = sourceCode.text.substring(
        charAfterImportRange[0],
        charAfterImportRange[1],
      );

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
    .find(specifier => specifier.type === 'ImportDefaultSpecifier');
  return defaultSpecifier != null ? defaultSpecifier.local.name : undefined;
}

// Checks whether `node` has a namespace import.
function hasNamespace(node) {
  const specifiers = node.specifiers
    .filter(specifier => specifier.type === 'ImportNamespaceSpecifier');
  return specifiers.length > 0;
}

// Checks whether `node` has any non-default specifiers.
function hasSpecifiers(node) {
  const specifiers = node.specifiers
    .filter(specifier => specifier.type === 'ImportSpecifier');
  return specifiers.length > 0;
}

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode) ||
    hasCommentAfter(node, sourceCode) ||
    hasCommentInsideNonSpecifiers(node, sourceCode)
  );
}

// Checks whether `node` has a comment (that ends) on the previous line or on
// the same line as `node` (starts).
function hasCommentBefore(node, sourceCode) {
  return sourceCode.getCommentsBefore(node)
    .some(comment => comment.loc.end.line >= node.loc.start.line - 1);
}

// Checks whether `node` has a comment (that starts) on the same line as `node`
// (ends).
function hasCommentAfter(node, sourceCode) {
  return sourceCode.getCommentsAfter(node)
    .some(comment => comment.loc.start.line === node.loc.end.line);
}

// Checks whether `node` has any comments _inside,_ except inside the `{...}`
// part (if any).
function hasCommentInsideNonSpecifiers(node, sourceCode) {
  const tokens = sourceCode.getTokens(node);
  const openBraceIndex = tokens.findIndex(token => isPunctuator(token, '{'));
  const closeBraceIndex = tokens.findIndex(token => isPunctuator(token, '}'));
  // Slice away the first token, since we're no looking for comments _before_
  // `node` (only inside). If there's a `{...}` part, look for comments before
  // the `{`, but not before the `}` (hence the `+1`s).
  const someTokens = openBraceIndex >= 0 && closeBraceIndex >= 0
    ? tokens.slice(1, openBraceIndex + 1).concat(tokens.slice(closeBraceIndex + 1))
    : tokens.slice(1);
  return someTokens.some(token => sourceCode.getCommentsBefore(token).length > 0);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
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
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    // Prepare the resolver from options.
    const considerQueryStringOption = context.options[0] &&
      context.options[0]['considerQueryString'];
    const defaultResolver = sourcePath => resolve(sourcePath, context) || sourcePath;
    const resolver = considerQueryStringOption ? (sourcePath => {
      const parts = sourcePath.match(/^([^?]*)\?(.*)$/);
      if (!parts) {
        return defaultResolver(sourcePath);
      }
      return defaultResolver(parts[1]) + '?' + parts[2];
    }) : defaultResolver;

    const imported = new Map();
    const nsImported = new Map();
    const defaultTypesImported = new Map();
    const namedTypesImported = new Map();

    function getImportMap(n) {
      if (n.importKind === 'type') {
        return (
          n.specifiers.length > 0
          && n.specifiers[0].type === 'ImportDefaultSpecifier'
        ) ? defaultTypesImported : namedTypesImported;
      }

      return hasNamespace(n) ? nsImported : imported;
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

      'Program:exit': function () {
        checkImports(imported, context);
        checkImports(nsImported, context);
        checkImports(defaultTypesImported, context);
        checkImports(namedTypesImported, context);
      },
    };
  },
};
