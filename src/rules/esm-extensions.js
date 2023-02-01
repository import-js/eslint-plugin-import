'use strict';

const fs = require('fs');
const path = require('path');
const extensions = ['.js', '.ts', '.mjs', '.cjs'];
extensions.push(...extensions.map((ext) => `/index${ext}`));

// Guards
const isSimpleLiteralCallee = function (callee) { return callee != null && callee.type === 'Identifier' && callee.name != null; };

// ReportFixers
const getEsmImportFixer = function (tokenLiteral, updated) {
  return function (fixer) {
    return fixer.replaceText(excludeParenthesisFromTokenLocation(tokenLiteral), updated);
  };
};

// util functions
const fileExists = function (filePath) {
  try {
    (0, fs.accessSync)(filePath);
    return true;
  }
  catch (err) {
    if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
      // known and somewhat expected failure case.
      return false;
    }
    return false;
  }
};

const excludeParenthesisFromTokenLocation = function (token) {
  if (token.range == null || token.loc == null) {
    return token;
  }
  const rangeStart = token.range[0] + 1;
  const rangeEnd = token.range[1] - 1;
  const locColStart = token.loc.start.column + 1;
  const locColEnd = token.loc.end.column - 1;
  const newToken = {
    ...token,
    range: [rangeStart, rangeEnd],
    loc: {
      start: { ...token.loc.start, column: locColStart },
      end: { ...token.loc.end, column: locColEnd },
    },
  };

  return newToken;
};

const shouldIgnoreImport = function (importedPath) {
  return typeof importedPath !== 'string' || importedPath[0] !== '.' || importedPath.match(/\.(?:json|css|svg)/) != null;
};

const handleNodeWithImport = function (context, node) {
  if (node.source == null) {
    return;
  }
  const importSource = node.source;
  const importedPath = importSource.value;
  if (shouldIgnoreImport(importedPath)) {
    return;
  }
  const cwd = context.getCwd();
  const filename = context.getFilename();
  const relativeFilePath = (0, path.relative)(cwd, filename);
  const relativeSourceFileDir = (0, path.dirname)(relativeFilePath);
  const absoluteSourceFileDir = (0, path.resolve)(cwd, relativeSourceFileDir);
  const importHasJsExtension = importedPath.match(/\.js$/);
  const importedFileAbsolutePath = (0, path.resolve)(absoluteSourceFileDir, importedPath);
  let correctImportAbsolutePath = null;
  if (importHasJsExtension == null) {
    // no extension, try different ones.
    try {
      for (let _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
        const ext = extensions_1[_i];
        const path = ''.concat(importedFileAbsolutePath).concat(ext);
        if (fileExists(path)) {
          correctImportAbsolutePath = path;
          break;
        }
      }
    }
    catch (err) {
      console.error(err);
    }
  }
  else {
    // extension exists, try to access it.
    if (fileExists(importedFileAbsolutePath)) {
      correctImportAbsolutePath = importedFileAbsolutePath;
    }
    else if (relativeFilePath.match(/\.ts/) != null) {
      // if we're in a typescript repo and they're using .js extensions, they wont exist in the source.
      const typescriptImportedFileAbsolutePath = importedFileAbsolutePath.replace(/\.js/, '.ts');
      if (fileExists(typescriptImportedFileAbsolutePath)) {
        correctImportAbsolutePath = importedFileAbsolutePath;
      }
      else {
        console.log('importedFileAbsolutePath doesnt exist', importedFileAbsolutePath);
        console.log('typescriptImportedFileAbsolutePath doesnt exist', typescriptImportedFileAbsolutePath);
        console.log('node', node);
        throw new Error('Workaround not implemented');
      }
    }
    else {
      console.log('importedFileAbsolutePath doesnt exist', importedFileAbsolutePath);
      console.log('And the file being checked is not a typescript file:', relativeFilePath);
      throw new Error('Workaround not implemented');
    }
  }
  const importOrExportLabel = node.type.match(/import/i) != null ? 'import of' : 'export from';
  if (correctImportAbsolutePath == null) {
    context.report({
      message: "Could not determine whether current import path of '".concat(importedPath, "' is valid or not"),
      node,
    });
  }
  else {
    if (importedFileAbsolutePath !== correctImportAbsolutePath) {
      let correctImportPath = (0, path.relative)(absoluteSourceFileDir, correctImportAbsolutePath);
      if (correctImportPath.match(/^\./) == null) {
        correctImportPath = './'.concat(correctImportPath);
      }

      const suggestionDesc = "Use '".concat(correctImportPath, "' instead.");
      const fix = getEsmImportFixer(importSource, correctImportPath);
      context.report({
        message: 'Invalid ESM '.concat(importOrExportLabel, " '").concat(importedPath, "'. ").concat(suggestionDesc),
        node,
        suggest: [
          {
            desc: suggestionDesc,
            fix,
          },
        ],
        fix,
      });
    }
  }
};

// Rule Listeners
const getVariableDeclarationListener = function (_a) {
  const context = _a.context;
  return function (node) {
    const sourceCode = context.getSourceCode();
    const nodeSource = sourceCode.getText(node);
    if (nodeSource.match(/= require\([^)]+\)/)) {
      node.declarations.forEach(function (declaration) {
        if (declaration.init && declaration.init.type === 'CallExpression') {
          const callee = declaration.init.callee;
          if (isSimpleLiteralCallee(callee) && callee.name === 'require') {
            context.report({
              message: 'Do not use require inside of ESM modules',
              node,
            });
          }
        }
      });
    }
  };
};

const getImportDeclarationListener = function (_a) {
  const context = _a.context;
  return function (node) {
    handleNodeWithImport(context, node);
  };
};

const getExportDeclarationListener = function (_a) {
  const context = _a.context;
  return function (node) {
    const sourceCode = context.getSourceCode();
    const exportSource = sourceCode.getText(node);
    if (exportSource.match(/ from /) == null) {
      return;
    }
    handleNodeWithImport(context, node);
  };
};

// Rule
const esmExtensionsRule = {
  meta: {
    hasSuggestions: true,
    fixable: 'code',
  },
  create(context) { return ({
    VariableDeclaration: getVariableDeclarationListener({ context }),
    ExportAllDeclaration: getExportDeclarationListener({ context, name: 'ExportAllDeclaration' }),
    ExportDeclaration: getExportDeclarationListener({ context, name: 'ExportDeclaration' }),
    ExportNamedDeclaration: getExportDeclarationListener({ context, name: 'ExportNamedDeclaration' }),
    ImportDeclaration: getImportDeclarationListener({ context }),
  }); },
};
module.exports = esmExtensionsRule;
//# sourceMappingURL=esm-extensions.js.map
