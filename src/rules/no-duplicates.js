import { getSourceCode } from 'eslint-module-utils/contextCompat';
import resolve from 'eslint-module-utils/resolve';
import semver from 'semver';
import flatMap from 'array.prototype.flatmap';

import docsUrl from '../docsUrl';

let typescriptPkg;
try {
  typescriptPkg = require('typescript/package.json'); // eslint-disable-line import/no-extraneous-dependencies
} catch (e) { /**/ }

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

// It's not obvious what the user wants to do with comments associated with
// duplicate imports, so skip imports with comments when autofixing.
function hasProblematicComments(node, sourceCode) {
  return (
    hasCommentBefore(node, sourceCode)
    || hasCommentAfter(node, sourceCode)
    || hasCommentInsideNonSpecifiers(node, sourceCode)
  );
}

/** @type {(first: import('estree').ImportDeclaration, rest: import('estree').ImportDeclaration[], sourceCode: import('eslint').SourceCode.SourceCode, context: import('eslint').Rule.RuleContext) => import('eslint').Rule.ReportFixer | undefined} */
function getFix(first, rest, sourceCode, context) {
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
    .filter((x) => !!x);

  const unnecessaryImports = restWithoutComments.filter((node) => !hasSpecifiers(node)
    && !hasNamespace(node)
    && !specifiers.some((specifier) => specifier.importNode === node),
  );

  const shouldAddDefault = getDefaultImportName(first) == null && defaultImportNames.size === 1;
  const shouldAddSpecifiers = specifiers.length > 0;
  const shouldRemoveUnnecessary = unnecessaryImports.length > 0;
  const preferInline = context.options[0] && context.options[0]['prefer-inline'];

  if (!(shouldAddDefault || shouldAddSpecifiers || shouldRemoveUnnecessary)) {
    return undefined;
  }

  /** @type {import('eslint').Rule.ReportFixer} */
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
        const isTypeSpecifier = specifier.importNode.importKind === 'type';

        // a user might set prefer-inline but not have a supporting TypeScript version. Flow does not support inline types so this should fail in that case as well.
        if (preferInline && (!typescriptPkg || !semver.satisfies(typescriptPkg.version, '>= 4.5'))) {
          throw new Error('Your version of TypeScript does not support inline type imports.');
        }

        // Add *only* the new identifiers that don't already exist, and track any new identifiers so we don't add them again in the next loop
        const [specifierText, updatedExistingIdentifiers] = specifier.identifiers.reduce(([text, set], cur) => {
          const trimmed = cur.trim(); // Trim whitespace before/after to compare to our set of existing identifiers
          const curWithType = trimmed.length > 0 && preferInline && isTypeSpecifier ? `type ${cur}` : cur;
          if (existingIdentifiers.has(trimmed)) {
            return [text, set];
          }
          return [text.length > 0 ? `${text},${curWithType}` : curWithType, set.add(trimmed)];
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

    /** @type {import('eslint').Rule.Fix[]} */
    const fixes = [];

    if (shouldAddSpecifiers && preferInline && first.importKind === 'type') {
      // `import type {a} from './foo'` → `import {type a} from './foo'`
      const typeIdentifierToken = tokens.find((token) => token.type === 'Identifier' && token.value === 'type');
      fixes.push(fixer.removeRange([typeIdentifierToken.range[0], typeIdentifierToken.range[1] + 1]));

      tokens
        .filter((token) => firstExistingIdentifiers.has(token.value))
        .forEach((identifier) => {
          fixes.push(fixer.replaceTextRange([identifier.range[0], identifier.range[1]], `type ${identifier.value}`));
        });
    }

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
    } else if (!shouldAddDefault && openBrace != null && closeBrace != null) {
      // `import {...} './foo'` → `import {..., ...} from './foo'`
      fixes.push(fixer.insertTextBefore(closeBrace, specifiersText));
    }

    // Remove imports whose specifiers have been moved into the first import.
    specifiers.forEach((specifier) => {
      const importNode = specifier.importNode;
      fixes.push(fixer.remove(importNode));

      const charAfterImportRange = [importNode.range[1], importNode.range[1] + 1];
      const charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
      if (charAfterImport === '\n') {
        fixes.push(fixer.removeRange(charAfterImportRange));
      }
    });

    // Remove imports whose default import has been moved to the first import,
    // and side-effect-only imports that are unnecessary due to the first
    // import.
    unnecessaryImports.forEach((node) => {
      fixes.push(fixer.remove(node));

      const charAfterImportRange = [node.range[1], node.range[1] + 1];
      const charAfterImport = sourceCode.text.substring(charAfterImportRange[0], charAfterImportRange[1]);
      if (charAfterImport === '\n') {
        fixes.push(fixer.removeRange(charAfterImportRange));
      }
    });

    return fixes;
  };
}

/** @type {(imported: Map<string, import('estree').ImportDeclaration[]>, context: import('eslint').Rule.RuleContext) => void} */
function checkImports(imported, context) {
  for (const [module, nodes] of imported.entries()) {
    if (nodes.length > 1) {
      const message = `'${module}' imported multiple times.`;
      const [first, ...rest] = nodes;
      const sourceCode = getSourceCode(context);
      const fix = getFix(first, rest, sourceCode, context);

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

/** @type {import('eslint').Rule.RuleModule} */
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

  /** @param {import('eslint').Rule.RuleContext} context */
  create(context) {
    /** @type {boolean} */
    // Prepare the resolver from options.
    const considerQueryStringOption = context.options[0] && context.options[0].considerQueryString;
    /** @type {boolean} */
    const preferInline = context.options[0] && context.options[0]['prefer-inline'];
    const defaultResolver = (sourcePath) => resolve(sourcePath, context) || sourcePath;
    const resolver = considerQueryStringOption ? (sourcePath) => {
      const parts = sourcePath.match(/^([^?]*)\?(.*)$/);
      if (!parts) {
        return defaultResolver(sourcePath);
      }
      return `${defaultResolver(parts[1])}?${parts[2]}`;
    } : defaultResolver;

    /** @type {Map<unknown, { imported: Map<string, import('estree').ImportDeclaration[]>, nsImported: Map<string, import('estree').ImportDeclaration[]>, defaultTypesImported: Map<string, import('estree').ImportDeclaration[]>, namedTypesImported: Map<string, import('estree').ImportDeclaration[]>}>} */
    const moduleMaps = new Map();

    /** @param {import('estree').ImportDeclaration} n */
    /** @returns {typeof moduleMaps[keyof typeof moduleMaps]} */
    function getImportMap(n) {
      if (!moduleMaps.has(n.parent)) {
        moduleMaps.set(n.parent, /** @type {typeof moduleMaps} */ {
          imported: new Map(),
          nsImported: new Map(),
          defaultTypesImported: new Map(),
          namedTypesImported: new Map(),
        });
      }
      const map = moduleMaps.get(n.parent);
      if (!preferInline && n.importKind === 'type') {
        return n.specifiers.length > 0 && n.specifiers[0].type === 'ImportDefaultSpecifier' ? map.defaultTypesImported : map.namedTypesImported;
      }
      if (!preferInline && n.specifiers.some((spec) => spec.importKind === 'type')) {
        return map.namedTypesImported;
      }

      return hasNamespace(n) ? map.nsImported : map.imported;
    }

    return {
      /** @param {import('estree').ImportDeclaration} n */
      ImportDeclaration(n) {
        /** @type {string} */
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
        }
      },
    };
  },
};
