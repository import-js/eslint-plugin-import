'use strict';

const isCoreModule = require('is-core-module');
const { default: docsUrl } = require('../docsUrl');

const DO_PREFER_MESSAGE_ID = 'requireNodeProtocol';
const NEVER_PREFER_MESSAGE_ID = 'forbidNodeProtocol';
const messages = {
  [DO_PREFER_MESSAGE_ID]: 'Prefer `node:{{moduleName}}` over `{{moduleName}}`.',
  [NEVER_PREFER_MESSAGE_ID]: 'Prefer `{{moduleName}}` over `node:{{moduleName}}`.',
};

function replaceStringLiteral(
  fixer,
  node,
  text,
  relativeRangeStart,
  relativeRangeEnd,
) {
  const firstCharacterIndex = node.range[0] + 1;
  const start = Number.isInteger(relativeRangeEnd)
    ? relativeRangeStart + firstCharacterIndex
    : firstCharacterIndex;
  const end = Number.isInteger(relativeRangeEnd)
    ? relativeRangeEnd + firstCharacterIndex
    : node.range[1] - 1;

  return fixer.replaceTextRange([start, end], text);
}

function isStringLiteral(node) {
  return node && node.type === 'Literal' && typeof node.value === 'string';
}

function isStaticRequireWith1Param(node) {
  return !node.optional
    && node.callee.type === 'Identifier'
    && node.callee.name === 'require'
    // check for only 1 argument
    && node.arguments.length === 1
    && node.arguments[0]
    && isStringLiteral(node.arguments[0]);
}

function checkAndReport(src, context) {
  // TODO use src.quasis[0].value.raw
  if (!src || src.type === 'TemplateLiteral') { return; }
  const moduleName = 'value' in src ? src.value : src.name;
  if (typeof moduleName !== 'string') { console.log(src, moduleName); }
  const { settings } = context;
  const nodeVersion = settings && settings['import/node-version'];
  if (
    typeof nodeVersion !== 'undefined'
    && (
      typeof nodeVersion !== 'string'
      || !(/^[0-9]+\.[0-9]+\.[0-9]+$/).test(nodeVersion)
    )
  ) {
    throw new TypeError('`import/node-version` setting must be a string in the format "10.23.45" (a semver version, with no leading zero)');
  }

  if (context.options[0] === 'never') {
    if (!moduleName.startsWith('node:')) { return; }

    const actualModuleName = moduleName.slice(5);
    if (!isCoreModule(actualModuleName, nodeVersion || undefined)) { return; }

    context.report({
      node: src,
      message: messages[NEVER_PREFER_MESSAGE_ID],
      data: { moduleName: actualModuleName },
      /** @param {import('eslint').Rule.RuleFixer} fixer */
      fix(fixer) {
        return replaceStringLiteral(fixer, src, '', 0, 5);
      },
    });
  } else if (context.options[0] === 'always') {
    if (
      moduleName.startsWith('node:')
      || !isCoreModule(moduleName, nodeVersion || undefined)
      || !isCoreModule(`node:${moduleName}`, nodeVersion || undefined)
    ) {
      return;
    }

    context.report({
      node: src,
      message: messages[DO_PREFER_MESSAGE_ID],
      data: { moduleName },
      /** @param {import('eslint').Rule.RuleFixer} fixer */
      fix(fixer) {
        return replaceStringLiteral(fixer, src, 'node:', 0, 0);
      },
    });
  } else if (typeof context.options[0] === 'undefined') {
    throw new Error('Missing option');
  } else {
    throw new Error(`Unexpected option: ${context.options[0]}`);
  }
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce either using, or omitting, the `node:` protocol when importing Node.js builtin modules.',
      recommended: true,
      category: 'Static analysis',
      url: docsUrl('enforce-node-protocol-usage'),
    },
    fixable: 'code',
    schema: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: [
        {
          enum: ['always', 'never'],
        },
      ],
    },
    messages,
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isStaticRequireWith1Param(node)) { return; }

        const arg = node.arguments[0];

        return checkAndReport(arg, context);
      },
      ExportNamedDeclaration(node) {
        return checkAndReport(node.source, context);
      },
      ImportDeclaration(node) {
        return checkAndReport(node.source, context);
      },
      ImportExpression(node) {
        if (!isStringLiteral(node.source)) { return; }

        return checkAndReport(node.source, context);
      },
    };
  },
};
