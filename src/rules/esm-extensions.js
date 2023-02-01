"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var fs_1 = require("fs");
var path_1 = require("path");
var extensions = ['.js', '.ts', '.mjs', '.cjs'];
extensions.push.apply(extensions, extensions.map(function (ext) { return "/index".concat(ext); }));
// TypeScript Guards
var isSimpleLiteralCallee = function (callee) { return callee != null && callee.type === 'Identifier' && callee.name != null; };
// ReportFixers
var getEsmImportFixer = function (tokenLiteral, updated) { return function (fixer) {
  const fixed = fixer.replaceText(excludeParenthesisFromTokenLocation(tokenLiteral), updated)
  // console.log(`tokenLiteral: `, tokenLiteral);
  // console.log(`updated: `, updated);
  // console.log(`fixed: `, fixed);
  return fixed
    // return fixer.replaceText(excludeParenthesisFromTokenLocation(tokenLiteral), updated);
}; };
// util functions
var fileExists = function (filePath) {
    try {
        (0, fs_1.accessSync)(filePath);
        return true;
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
            // known and somewhat expected failure case.
            return false;
        }
        // console.error('Unexpected error attempting to access filepath', filePath);
        // console.error(err);
        return false;
    }
};
var excludeParenthesisFromTokenLocation = function (token) {
    if (token.range == null || token.loc == null) {
        return token;
    }
    var rangeStart = token.range[0] + 1;
    var rangeEnd = token.range[1] - 1;
    var locColStart = token.loc.start.column + 1;
    var locColEnd = token.loc.end.column - 1;
    var newToken = __assign(__assign({}, token), { range: [rangeStart, rangeEnd], loc: {
            start: __assign(__assign({}, token.loc.start), { column: locColStart }),
            end: __assign(__assign({}, token.loc.end), { column: locColEnd }),
        } });

    return newToken;
};

var shouldIgnoreImport = function (importedPath) {
  return typeof importedPath !== 'string' || importedPath[0] !== '.' || importedPath.match(/\.(?:json|css|svg)/) != null
}

var handleNodeWithImport = function (context, node) {
    if (node.source == null) {
        return;
    }
    var importSource = node.source;
    var importedPath = importSource.value;
    if (shouldIgnoreImport(importedPath)) {
        return;
    }
    var cwd = context.getCwd();
    var filename = context.getFilename();
    var relativeFilePath = (0, path_1.relative)(cwd, filename);
    var relativeSourceFileDir = (0, path_1.dirname)(relativeFilePath);
    var absoluteSourceFileDir = (0, path_1.resolve)(cwd, relativeSourceFileDir);
    var importHasJsExtension = importedPath.match(/\.js$/);
    var importedFileAbsolutePath = (0, path_1.resolve)(absoluteSourceFileDir, importedPath);
    var correctImportAbsolutePath = null;
    if (importHasJsExtension == null) {
        // no extension, try different ones.
        try {
            for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
                var ext = extensions_1[_i];
                var path = "".concat(importedFileAbsolutePath).concat(ext);
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
            var typescriptImportedFileAbsolutePath = importedFileAbsolutePath.replace(/\.js/, '.ts');
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
    var importOrExportLabel = node.type.match(/import/i) != null ? 'import of' : 'export from';
    if (correctImportAbsolutePath == null) {
        context.report({
            message: "Could not determine whether current import path of '".concat(importedPath, "' is valid or not"),
            node: node
        });
    }
    else {
        if (importedFileAbsolutePath !== correctImportAbsolutePath) {
            var correctImportPath = (0, path_1.relative)(absoluteSourceFileDir, correctImportAbsolutePath);
            if (correctImportPath.match(/^\./) == null) {
              correctImportPath = './'.concat(correctImportPath);
            }
            // console.log(`correctImportAbsolutePath: `, correctImportAbsolutePath);
            // console.log(`absoluteSourceFileDir: `, absoluteSourceFileDir);
            var suggestionDesc = "Use '".concat(correctImportPath, "' instead.");
            var fix = getEsmImportFixer(importSource, correctImportPath);
            context.report({
                message: "Invalid ESM ".concat(importOrExportLabel, " '").concat(importedPath, "'. ").concat(suggestionDesc),
                node: node,
                suggest: [
                    {
                        desc: suggestionDesc,
                        fix: fix,
                    }
                ],
                fix: fix,
            });
        }
    }
};
// Rule Listeners
var getVariableDeclarationListener = function (_a) {
    var context = _a.context;
    return function (node) {
        var sourceCode = context.getSourceCode();
        var nodeSource = sourceCode.getText(node);
        if (nodeSource.match(/= require\([^)]+\)/)) {
            node.declarations.forEach(function (declaration) {
                if (declaration.init && declaration.init.type === 'CallExpression') {
                    var callee = declaration.init.callee;
                    if (isSimpleLiteralCallee(callee) && callee.name === 'require') {
                        context.report({
                            message: "Do not use require inside of ESM modules",
                            node: node,
                        });
                    }
                }
            });
        }
    };
};
var getImportDeclarationListener = function (_a) {
    var context = _a.context;
    return function (node) {
        handleNodeWithImport(context, node);
    };
};
var getExportDeclarationListener = function (_a) {
    var context = _a.context, name = _a.name;
    return function (node) {
        var sourceCode = context.getSourceCode();
        var exportSource = sourceCode.getText(node);
        if (exportSource.match(/ from /) == null) {
            return;
        }
        handleNodeWithImport(context, node);
    };
};
// Rule
var esmExtensionsRule = {
    meta: {
        hasSuggestions: true,
        fixable: 'code'
    },
    create: function (context) { return ({
        VariableDeclaration: getVariableDeclarationListener({ context: context }),
        ExportAllDeclaration: getExportDeclarationListener({ context: context, name: 'ExportAllDeclaration' }),
        ExportDeclaration: getExportDeclarationListener({ context: context, name: 'ExportDeclaration' }),
        ExportNamedDeclaration: getExportDeclarationListener({ context: context, name: 'ExportNamedDeclaration' }),
        ImportDeclaration: getImportDeclarationListener({ context: context }),
    }); }
};
module.exports = esmExtensionsRule;
//# sourceMappingURL=esm-extensions.js.map
