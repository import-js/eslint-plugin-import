/**
 * @fileoverview Rule to enforce new line after import not followed by another import.
 * @author Radek Benkel
 */

import isStaticRequire from '../core/staticRequire';
import docsUrl from '../docsUrl';

import debug from 'debug';
const log = debug('eslint-plugin-import:rules:newline-after-import');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

function containsNodeOrEqual(outerNode, innerNode) {
  return outerNode.range[0] <= innerNode.range[0] && outerNode.range[1] >= innerNode.range[1];
}

function getScopeBody(scope) {
  if (scope.block.type === 'SwitchStatement') {
    log('SwitchStatement scopes not supported');
    return null;
  }

  const { body } = scope.block;
  if (body && body.type === 'BlockStatement') {
    return body.body;
  }

  return body;
}

function findNodeIndexInScopeBody(body, nodeToFind) {
  return body.findIndex((node) => containsNodeOrEqual(node, nodeToFind));
}

function getLineDifference(node, nextNode) {
  return nextNode.loc.start.line - node.loc.end.line;
}

function isClassWithDecorator(node) {
  return node.type === 'ClassDeclaration' && node.decorators && node.decorators.length;
}

function isExportDefaultClass(node) {
  return node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'ClassDeclaration';
}

function isExportNameClass(node) {

  return node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'ClassDeclaration';
}

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      url: docsUrl('newline-after-import'),
    },
    fixable: 'whitespace',
    schema: [
      {
        'type': 'object',
        'properties': {
          'count': {
            'type': 'integer',
            'minimum': 1,
          },
          'considerComments': { 'type': 'boolean' },
        },
        'additionalProperties': false,
      },
    ],
  },
  create(context) {
    let level = 0;
    const requireCalls = [];
    const options = Object.assign({ count: 1, considerComments: false }, context.options[0]);

    function checkForNewLine(node, nextNode, type) {
      if (isExportDefaultClass(nextNode) || isExportNameClass(nextNode)) {
        const classNode = nextNode.declaration;

        if (isClassWithDecorator(classNode)) {
          nextNode = classNode.decorators[0];
        }
      } else if (isClassWithDecorator(nextNode)) {
        nextNode = nextNode.decorators[0];
      }

      const lineDifference = getLineDifference(node, nextNode);
      const EXPECTED_LINE_DIFFERENCE = options.count + 1;

      if (lineDifference < EXPECTED_LINE_DIFFERENCE) {
        let column = node.loc.start.column;

        if (node.loc.start.line !== node.loc.end.line) {
          column = 0;
        }

        context.report({
          loc: {
            line: node.loc.end.line,
            column,
          },
          message: `Expected ${options.count} empty line${options.count > 1 ? 's' : ''} after ${type} statement not followed by another ${type}.`,
          fix: fixer => fixer.insertTextAfter(
            node,
            '\n'.repeat(EXPECTED_LINE_DIFFERENCE - lineDifference),
          ),
        });
      }
    }

    function commentAfterImport(node, nextComment) {
      const lineDifference = getLineDifference(node, nextComment);
      const EXPECTED_LINE_DIFFERENCE = options.count + 1;

      if (lineDifference < EXPECTED_LINE_DIFFERENCE) {
        let column = node.loc.start.column;

        if (node.loc.start.line !== node.loc.end.line) {
          column = 0;
        }

        context.report({
          loc: {
            line: node.loc.end.line,
            column,
          },
          message: `Expected ${options.count} empty line${options.count > 1 ? 's' : ''} after import statement not followed by another import.`,
          fix: fixer => fixer.insertTextAfter(
            node,
            '\n'.repeat(EXPECTED_LINE_DIFFERENCE - lineDifference),
          ),
        });
      }
    }

    function incrementLevel() {
      level++;
    }
    function decrementLevel() {
      level--;
    }

    function checkImport(node) {
      const { parent } = node;
      const nodePosition = parent.body.indexOf(node);
      const nextNode = parent.body[nodePosition + 1];
      const endLine = node.loc.end.line;
      let nextComment;

      if (typeof parent.comments !== 'undefined' && options.considerComments) {
        nextComment = parent.comments.find(o => o.loc.start.line === endLine + 1);
      }


      // skip "export import"s
      if (node.type === 'TSImportEqualsDeclaration' && node.isExport) {
        return;
      }

      if (nextComment && typeof nextComment !== 'undefined') {
        commentAfterImport(node, nextComment);
      } else if (nextNode && nextNode.type !== 'ImportDeclaration' && (nextNode.type !== 'TSImportEqualsDeclaration' || nextNode.isExport)) {
        checkForNewLine(node, nextNode, 'import');
      }
    }

    return {
      ImportDeclaration: checkImport,
      TSImportEqualsDeclaration: checkImport,
      CallExpression(node) {
        if (isStaticRequire(node) && level === 0) {
          requireCalls.push(node);
        }
      },
      'Program:exit': function () {
        log('exit processing for', context.getPhysicalFilename ? context.getPhysicalFilename() : context.getFilename());
        const scopeBody = getScopeBody(context.getScope());
        log('got scope:', scopeBody);

        requireCalls.forEach(function (node, index) {
          const nodePosition = findNodeIndexInScopeBody(scopeBody, node);
          log('node position in scope:', nodePosition);

          const statementWithRequireCall = scopeBody[nodePosition];
          const nextStatement = scopeBody[nodePosition + 1];
          const nextRequireCall = requireCalls[index + 1];

          if (nextRequireCall && containsNodeOrEqual(statementWithRequireCall, nextRequireCall)) {
            return;
          }

          if (nextStatement &&
             (!nextRequireCall || !containsNodeOrEqual(nextStatement, nextRequireCall))) {

            checkForNewLine(statementWithRequireCall, nextStatement, 'require');
          }
        });
      },
      FunctionDeclaration: incrementLevel,
      FunctionExpression: incrementLevel,
      ArrowFunctionExpression: incrementLevel,
      BlockStatement: incrementLevel,
      ObjectExpression: incrementLevel,
      Decorator: incrementLevel,
      'FunctionDeclaration:exit': decrementLevel,
      'FunctionExpression:exit': decrementLevel,
      'ArrowFunctionExpression:exit': decrementLevel,
      'BlockStatement:exit': decrementLevel,
      'ObjectExpression:exit': decrementLevel,
      'Decorator:exit': decrementLevel,
    };
  },
};
