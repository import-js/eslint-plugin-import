import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

const DEFAULT_MAX = 10;

const countDependencies = (dependencies, lastNode, context) => {
  const { max } = context.options[0] || { max: DEFAULT_MAX };

  if (dependencies.size > max) {
    context.report(
      lastNode,
      `Maximum number of dependencies (${max}) exceeded.`
    );
  }
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('max-dependencies'),
    },

    schema: [
      {
        'type': 'object',
        'properties': {
          'max': { 'type': 'number' },
        },
        'additionalProperties': false,
      },
    ],
  },

  create: context => {
    const dependencies = new Set(); // keep track of dependencies
    let lastNode; // keep track of the last node to report on

    return Object.assign({
      'Program:exit': function () {
        countDependencies(dependencies, lastNode, context);
      },
    }, moduleVisitor((source) => {
      dependencies.add(source.value);
      lastNode = source;
    }, { commonjs: true }));
  },
};
