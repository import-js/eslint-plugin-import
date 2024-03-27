import includes from 'array-includes';
import { SourceCode } from 'eslint';
import { availableDocStyleParsers, captureDoc } from './doc';
import Namespace from './namespace';
import processSpecifier from './specifier';
import { captureDependency, captureDependencyWithSpecifiers } from './captureDependency';
import recursivePatternCapture from './patternCapture';
import { RemotePath } from './remotePath';

/**
 * sometimes legacy support isn't _that_ hard... right?
 */
function makeSourceCode(text, ast) {
  if (SourceCode.length > 1) {
    // ESLint 3
    return new SourceCode(text, ast);
  } else {
    // ESLint 4, 5
    return new SourceCode({ text, ast });
  }
}

export default class ImportExportVisitorBuilder {
  constructor(
    path,
    context,
    exportMap,
    ExportMapBuilder,
    content,
    ast,
    isEsModuleInteropTrue,
    thunkFor,
  ) {
    this.context = context;
    this.namespace = new Namespace(path, context, ExportMapBuilder);
    this.remotePathResolver = new RemotePath(path, context);
    this.source = makeSourceCode(content, ast);
    this.exportMap = exportMap;
    this.ast = ast;
    this.isEsModuleInteropTrue = isEsModuleInteropTrue;
    this.thunkFor = thunkFor;
    const docstyle = this.context.settings && this.context.settings['import/docstyle'] || ['jsdoc'];
    this.docStyleParsers = {};
    docstyle.forEach((style) => {
      this.docStyleParsers[style] = availableDocStyleParsers[style];
    });
  }

  build(astNode) {
    return {
      ExportDefaultDeclaration() {
        const exportMeta = captureDoc(this.source, this.docStyleParsers, astNode);
        if (astNode.declaration.type === 'Identifier') {
          this.namespace.add(exportMeta, astNode.declaration);
        }
        this.exportMap.namespace.set('default', exportMeta);
      },
      ExportAllDeclaration() {
        const getter = captureDependency(astNode, astNode.exportKind === 'type', this.remotePathResolver, this.exportMap, this.context, this.thunkFor);
        if (getter) { this.exportMap.dependencies.add(getter); }
        if (astNode.exported) {
          processSpecifier(astNode, astNode.exported, this.exportMap, this.namespace);
        }
      },
      /** capture namespaces in case of later export */
      ImportDeclaration() {
        captureDependencyWithSpecifiers(astNode, this.remotePathResolver, this.exportMap, this.context, this.thunkFor);
        const ns = astNode.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
        if (ns) {
          this.namespace.rawSet(ns.local.name, astNode.source.value);
        }
      },
      ExportNamedDeclaration() {
        captureDependencyWithSpecifiers(astNode, this.remotePathResolver, this.exportMap, this.context, this.thunkFor);
        // capture declaration
        if (astNode.declaration != null) {
          switch (astNode.declaration.type) {
            case 'FunctionDeclaration':
            case 'ClassDeclaration':
            case 'TypeAlias': // flowtype with babel-eslint parser
            case 'InterfaceDeclaration':
            case 'DeclareFunction':
            case 'TSDeclareFunction':
            case 'TSEnumDeclaration':
            case 'TSTypeAliasDeclaration':
            case 'TSInterfaceDeclaration':
            case 'TSAbstractClassDeclaration':
            case 'TSModuleDeclaration':
              this.exportMap.namespace.set(astNode.declaration.id.name, captureDoc(this.source, this.docStyleParsers, astNode));
              break;
            case 'VariableDeclaration':
              astNode.declaration.declarations.forEach((d) => {
                recursivePatternCapture(
                  d.id,
                  (id) => this.exportMap.namespace.set(id.name, captureDoc(this.source, this.docStyleParsers, d, astNode)),
                );
              });
              break;
            default:
          }
        }
        astNode.specifiers.forEach((s) => processSpecifier(s, astNode, this.exportMap, this.namespace));
      },
      TSExportAssignment: () => this.typeScriptExport(astNode),
      ...this.isEsModuleInteropTrue && { TSNamespaceExportDeclaration: () => this.typeScriptExport(astNode) },
    };
  }

  // This doesn't declare anything, but changes what's being exported.
  typeScriptExport(astNode) {
    const exportedName = astNode.type === 'TSNamespaceExportDeclaration'
      ? (astNode.id || astNode.name).name
      : astNode.expression && astNode.expression.name || astNode.expression.id && astNode.expression.id.name || null;
    const declTypes = [
      'VariableDeclaration',
      'ClassDeclaration',
      'TSDeclareFunction',
      'TSEnumDeclaration',
      'TSTypeAliasDeclaration',
      'TSInterfaceDeclaration',
      'TSAbstractClassDeclaration',
      'TSModuleDeclaration',
    ];
    const exportedDecls = this.ast.body.filter(({ type, id, declarations }) => includes(declTypes, type) && (
      id && id.name === exportedName || declarations && declarations.find((d) => d.id.name === exportedName)
    ));
    if (exportedDecls.length === 0) {
      // Export is not referencing any local declaration, must be re-exporting
      this.exportMap.namespace.set('default', captureDoc(this.source, this.docStyleParsers, astNode));
      return;
    }
    if (
      this.isEsModuleInteropTrue // esModuleInterop is on in tsconfig
      && !this.exportMap.namespace.has('default') // and default isn't added already
    ) {
      this.exportMap.namespace.set('default', {}); // add default export
    }
    exportedDecls.forEach((decl) => {
      if (decl.type === 'TSModuleDeclaration') {
        if (decl.body && decl.body.type === 'TSModuleDeclaration') {
          this.exportMap.namespace.set(decl.body.id.name, captureDoc(this.source, this.docStyleParsers, decl.body));
        } else if (decl.body && decl.body.body) {
          decl.body.body.forEach((moduleBlockNode) => {
            // Export-assignment exports all members in the namespace,
            // explicitly exported or not.
            const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration'
              ? moduleBlockNode.declaration
              : moduleBlockNode;

            if (!namespaceDecl) {
              // TypeScript can check this for us; we needn't
            } else if (namespaceDecl.type === 'VariableDeclaration') {
              namespaceDecl.declarations.forEach((d) => recursivePatternCapture(d.id, (id) => this.exportMap.namespace.set(
                id.name,
                captureDoc(this.source, this.docStyleParsers, decl, namespaceDecl, moduleBlockNode),
              )),
              );
            } else {
              this.exportMap.namespace.set(
                namespaceDecl.id.name,
                captureDoc(this.source, this.docStyleParsers, moduleBlockNode));
            }
          });
        }
      } else {
        // Export as default
        this.exportMap.namespace.set('default', captureDoc(this.source, this.docStyleParsers, decl));
      }
    });
  }
}
