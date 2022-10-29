import docsUrl from '../docsUrl';

function getEmptyBlockRange(tokens, index) {
  const token = tokens[index];
  const nextToken = tokens[index + 1];
  const prevToken = tokens[index - 1];
  let start = token.range[0];
  const end = nextToken.range[1];

  // Remove block tokens and the previous comma
  if (prevToken.value === ','|| prevToken.value === 'type' || prevToken.value === 'typeof') {
    start = prevToken.range[0];
  }

  return [start, end];
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid empty named import blocks.',
      url: docsUrl('no-empty-named-blocks'),
    },
    fixable: 'code',
    schema: [],
    hasSuggestions: true,
  },

  create(context) {
    return {
      Program(node) {
        node.tokens.forEach((token, idx) => {
          const nextToken = node.tokens[idx + 1];

          if (nextToken && token.value === '{' && nextToken.value === '}') {
            const hasOtherIdentifiers = node.tokens.some((token) => (
              token.type === 'Identifier'
                && token.value !== 'from'
                && token.value !== 'type'
                && token.value !== 'typeof'
            ));

            // If it has no other identifiers it's the only thing in the import, so we can either remove the import
            // completely or transform it in a side-effects only import
            if (!hasOtherIdentifiers) {
              context.report({
                node,
                message: 'Unexpected empty named import block',
                suggest: [
                  {
                    desc: 'Remove unused import',
                    fix(fixer) {
                      // Remove the whole import
                      return fixer.remove(node);
                    },
                  },
                  {
                    desc: 'Remove empty import block',
                    fix(fixer) {
                      // Remove the empty block and the 'from' token, leaving the import only for its side
                      // effects, e.g. `import 'mod'`
                      const sourceCode = context.getSourceCode();
                      const fromToken = node.tokens.find(t => t.value === 'from');
                      const importToken = node.tokens.find(t => t.value === 'import');
                      const hasSpaceAfterFrom = sourceCode.isSpaceBetween(fromToken, sourceCode.getTokenAfter(fromToken));
                      const hasSpaceAfterImport = sourceCode.isSpaceBetween(importToken, sourceCode.getTokenAfter(fromToken));

                      const [start] = getEmptyBlockRange(node.tokens, idx);
                      const [, end] = fromToken.range;
                      const range = [start, hasSpaceAfterFrom ? end + 1 : end];

                      return fixer.replaceTextRange(range, hasSpaceAfterImport ? '' : ' ');
                    },
                  },
                ],
              });
            } else {
              context.report({
                node,
                message: 'Unexpected empty named import block',
                fix(fixer) {
                  return fixer.removeRange(getEmptyBlockRange(node.tokens, idx));
                },
              });
            }
          }
        });
      },
    };
  },
};
