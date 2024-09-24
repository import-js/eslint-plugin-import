import { getScope } from 'eslint-module-utils/contextCompat';

import docsUrl from '../docsUrl';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Helpful warnings',
      description: 'Forbid the use of mutable exports with `var` or `let`.',
      url: docsUrl('no-mutable-exports'),
    },
    schema: [],
  },

  create(context) {
    function checkDeclaration(node) {
      const { kind } = node;
      if (kind === 'var' || kind === 'let') {
        context.report(node, `Exporting mutable '${kind}' binding, use 'const' instead.`);
      }
    }

    /** @type {(scope: import('eslint').Scope.Scope, name: string) => void} */
    function checkDeclarationsInScope({ variables }, name) {
      variables
        .filter((variable) => variable.name === name)
        .forEach((variable) => {
          variable.defs
            .filter((def) => def.type === 'Variable' && def.parent)
            .forEach((def) => {
              checkDeclaration(def.parent);
            });
        });
    }

    return {
      /** @param {import('estree').ExportDefaultDeclaration} node */
      ExportDefaultDeclaration(node) {
        const scope = getScope(context, node);

        if ('name' in node.declaration && node.declaration.name) {
          checkDeclarationsInScope(scope, node.declaration.name);
        }
      },

      /** @param {import('estree').ExportNamedDeclaration} node */
      ExportNamedDeclaration(node) {
        const scope = getScope(context, node);

        if ('declaration' in node && node.declaration)  {
          checkDeclaration(node.declaration);
        } else if (!('source' in node) || !node.source) {
          node.specifiers.forEach((specifier) => {
            checkDeclarationsInScope(scope, specifier.local.name);
          });
        }
      },
    };
  },
};
