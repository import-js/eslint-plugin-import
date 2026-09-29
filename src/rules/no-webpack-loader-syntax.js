import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

function reportIfNonStandard(context, node, name) {
  if (name && name.indexOf('!') !== -1) {
    context.report(node, `Unexpected '!' in '${name}'. Do not use import syntax to configure webpack loaders.`);
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      category: 'Static analysis',
      description: 'Forbid webpack loader syntax in imports.',
      url: docsUrl('no-webpack-loader-syntax'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          requireResolve: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    return moduleVisitor((source, node) => {
      reportIfNonStandard(context, node, source.value);
    }, { commonjs: true, requireResolve: options.requireResolve });
  },
};
