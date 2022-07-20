/**
 * @fileoverview Rule to disallow anonymous default exports.
 * @author Duncan Beevers
 */

import docsUrl from '../docsUrl';

const hasOwn = Function.bind.bind(Function.prototype.call)(Object.prototype.hasOwnProperty);
const { fromEntries, values } = Object;

const defs = {
  ArrayExpression: {
    option: 'allowArray',
    description: 'If `false`, will report default export of an array',
    message: 'Assign array to a variable before exporting as module default',
  },
  ArrowFunctionExpression: {
    option: 'allowArrowFunction',
    description: 'If `false`, will report default export of an arrow function',
    message: 'Assign arrow function to a variable before exporting as module default',
  },
  CallExpression: {
    option: 'allowCallExpression',
    description: 'If `false`, will report default export of a function call',
    message: 'Assign call result to a variable before exporting as module default',
    default: true,
  },
  ClassDeclaration: {
    option: 'allowAnonymousClass',
    description: 'If `false`, will report default export of an anonymous class',
    message: 'Unexpected default export of anonymous class',
    forbid: (node) => !node.declaration.id,
  },
  FunctionDeclaration: {
    option: 'allowAnonymousFunction',
    description: 'If `false`, will report default export of an anonymous function',
    message: 'Unexpected default export of anonymous function',
    forbid: (node) => !node.declaration.id,
  },
  Literal: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default',
  },
  ObjectExpression: {
    option: 'allowObject',
    description: 'If `false`, will report default export of an object expression',
    message: 'Assign object to a variable before exporting as module default',
  },
  TemplateLiteral: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default',
  },
  NewExpression: {
    option: 'allowNew',
    description: 'If `false`, will report default export of a class instantiation',
    message: 'Assign instance to a variable before exporting as module default',
  },
};

const schemaProperties = fromEntries(values(defs).map((def) => [def.option, {
  description: def.description,
  type: 'boolean',
}]));

const defaults = fromEntries(values(defs).map((def) => [def.option, hasOwn(def, 'default') ? def.default : false]));

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Style guide',
      description: 'Forbid anonymous values as default exports.',
      url: docsUrl('no-anonymous-default-export'),
    },

    schema: [
      {
        type: 'object',
        properties: schemaProperties,
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = { ...defaults, ...context.options[0] };

    return {
      ExportDefaultDeclaration(node) {
        const def = defs[node.declaration.type];

        // Recognized node type and allowed by configuration,
        //   and has no forbid check, or forbid check return value is truthy
        if (def && !options[def.option] && (!def.forbid || def.forbid(node))) {
          context.report({ node, message: def.message });
        }
      },
    };
  },
};
