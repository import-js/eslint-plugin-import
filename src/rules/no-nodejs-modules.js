import importType from '../core/importType';
import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

function reportIfMissing(context, node, allowed, name) {
  if (allowed.indexOf(name) === -1 && importType(name, context) === 'builtin') {
    context.report(node, 'Do not import Node.js builtin module "' + name + '"');
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-nodejs-modules'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            uniqueItems: true,
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowed = options.allow || [];

    return moduleVisitor((source, node) => {
      reportIfMissing(context, node, allowed, source.value);
    }, { commonjs: true });
  },
};
