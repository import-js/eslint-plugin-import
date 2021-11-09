import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

function reportIfNonStandard(context, node, name) {
  if (name && name.indexOf('!') !== -1) {
    context.report(node, `Unexpected '!' in '${name}'. ` +
      'Do not use import syntax to configure webpack loaders.',
    );
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: docsUrl('no-webpack-loader-syntax'),
    },
    schema: [],
  },

  create(context) {
    return moduleVisitor((source, node) => {
      reportIfNonStandard(context, node, source.value);
    }, { commonjs: true });
  },
};
