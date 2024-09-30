import { getSourceCode } from 'eslint-module-utils/contextCompat';

import docsUrl from '../docsUrl';
import sourceType from '../core/sourceType';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid default exports.',
      url: docsUrl('no-default-export'),
    },
    schema: [],
  },

  create(context) {
    // ignore non-modules
    if (sourceType(context) !== 'module') {
      return {};
    }

    const preferNamed = 'Prefer named exports.';
    const noAliasDefault = ({ local }) => `Do not alias \`${local.name}\` as \`default\`. Just export \`${local.name}\` itself instead.`;

    return {
      ExportDefaultDeclaration(node) {
        const { loc } = getSourceCode(context).getFirstTokens(node)[1] || {};
        context.report({ node, message: preferNamed, loc });
      },

      ExportNamedDeclaration(node) {
        node.specifiers
          .filter((specifier) => (specifier.exported.name || specifier.exported.value) === 'default')
          .forEach((specifier) => {
            const { loc } = getSourceCode(context).getFirstTokens(node)[1] || {};
            if (specifier.type === 'ExportDefaultSpecifier') {
              context.report({ node, message: preferNamed, loc });
            } else if (specifier.type === 'ExportSpecifier') {
              context.report({ node, message: noAliasDefault(specifier), loc  });
            }
          });
      },
    };
  },
};
