import moduleVisitor from 'eslint-module-utils/moduleVisitor';
import docsUrl from '../docsUrl';

const DEFAULT_MAX = 10;
const DEFAULT_IGNORE_TYPE_IMPORTS = false;
const TYPE_IMPORT = 'type';

const countDependencies = (dependencies, lastNode, context) => {
  const { max } = context.options[0] || { max: DEFAULT_MAX };

  if (dependencies.size > max) {
    context.report(lastNode, `Maximum number of dependencies (${max}) exceeded.`);
  }
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Enforce the maximum number of dependencies a module can have.',
      url: docsUrl('max-dependencies'),
    },

    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'number', default: 10 },
          ignoreTypeImports: { type: 'boolean', default: false },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const {
      ignoreTypeImports = DEFAULT_IGNORE_TYPE_IMPORTS,
    } = context.options[0] || {};

    const dependencies = new Set(); // keep track of dependencies
    let lastNode; // keep track of the last node to report on

    return {
      'Program:exit'() {
        countDependencies(dependencies, lastNode, context);
      },
      ...moduleVisitor(
        (source, { importKind }) => {
          if (importKind !== TYPE_IMPORT || !ignoreTypeImports) {
            dependencies.add(source.value);
          }
          lastNode = source;
        },
        { commonjs: true },
      ),
    };
  },
};
