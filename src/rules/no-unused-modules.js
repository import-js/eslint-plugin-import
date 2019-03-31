/**
 * @fileOverview Ensures that modules contain exports and/or all 
 * modules are consumed within other modules.
 * @author René Fermann
 */

import Exports from '../ExportMap'
import resolve from 'eslint-module-utils/resolve'
import docsUrl from '../docsUrl'

// eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
let listFilesToProcess
try {
  listFilesToProcess = require('eslint/lib/util/glob-utils').listFilesToProcess
} catch (err) {
  listFilesToProcess = require('eslint/lib/util/glob-util').listFilesToProcess
}

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration'
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration'
const EXPORT_ALL_DECLARATION = 'ExportAllDeclaration'
const IMPORT_DECLARATION = 'ImportDeclaration' 
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier'
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier' 
const VARIABLE_DECLARATION = 'VariableDeclaration'
const FUNCTION_DECLARATION = 'FunctionDeclaration'
const DEFAULT = 'default'

let preparationDone = false
const importList = new Map()
const exportList = new Map()
const ignoredFiles = new Set()

const isNodeModule = path => {
  return /\/(node_modules)\//.test(path)
}

/**
 * read all files matching the patterns in src and ignoreExports
 * 
 * return all files matching src pattern, which are not matching the ignoreExports pattern
 */
const resolveFiles = (src, ignoreExports) => {
  const srcFiles = new Set()
  const srcFileList = listFilesToProcess(src)

  // prepare list of ignored files
  const ignoredFilesList =  listFilesToProcess(ignoreExports)
  ignoredFilesList.forEach(({ filename }) => ignoredFiles.add(filename))

  // prepare list of source files, don't consider files from node_modules
  srcFileList.filter(({ filename }) => !isNodeModule(filename)).forEach(({ filename }) => {
    srcFiles.add(filename)
  })
  return srcFiles
}

/**
 * parse all source files and build up 2 maps containing the existing imports and exports
 */
const prepareImportsAndExports = (srcFiles, context) => {
  const exportAll = new Map()
  srcFiles.forEach(file => {
    const exports = new Map()
    const imports = new Map()
    const currentExports = Exports.get(file, context)
    if (currentExports) {
      const { dependencies, reexports, imports: localImportList, namespace  } = currentExports

      // dependencies === export * from 
      const currentExportAll = new Set()
      dependencies.forEach(value => {
        currentExportAll.add(value().path)
      })
      exportAll.set(file, currentExportAll)
      
      reexports.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() })
        } else {
          exports.set(key, { whereUsed: new Set() })
        }
        const reexport =  value.getImport()
        if (!reexport) {
          return
        }
        let localImport = imports.get(reexport.path)
        let currentValue
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER
        } else {
          currentValue = value.local
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([...localImport, currentValue])
        } else {
          localImport = new Set([currentValue])
        }
        imports.set(reexport.path, localImport)
      })

      localImportList.forEach((value, key) => {
        if (isNodeModule(key)) {
          return
        }
        imports.set(key, value.importedSpecifiers)
      })
      importList.set(file, imports)
      
      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return
      }
      namespace.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() })
        } else {
          exports.set(key, { whereUsed: new Set() })
        }
      })
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() })
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() })
    exportList.set(file, exports)
  })
  exportAll.forEach((value, key) => {
    value.forEach(val => {
      const currentExports = exportList.get(val)
      const currentExport = currentExports.get(EXPORT_ALL_DECLARATION)
      currentExport.whereUsed.add(key)
    })
  })
}

/**
 * traverse through all imports and add the respective path to the whereUsed-list 
 * of the corresponding export
 */
const determineUsage = () => {
  importList.forEach((listValue, listKey) => {
    listValue.forEach((value, key) => {
      const exports = exportList.get(key)
      if (typeof exports !== 'undefined') {
        value.forEach(currentImport => {
          let specifier
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER
          } else {
            specifier = currentImport
          }
          if (typeof specifier !== 'undefined') {
            const exportStatement = exports.get(specifier)
            if (typeof exportStatement !== 'undefined') {
              const { whereUsed } = exportStatement
              whereUsed.add(listKey)
              exports.set(specifier, { whereUsed })
            }
          }
        })
      }
    })
  })
}

const getSrc = src => {
  if (src) {
    return src
  }
  return [process.cwd()]
}

/**
 * prepare the lists of existing imports and exports - should only be executed once at
 * the start of a new eslint run
 */
const doPreparation = (src, ignoreExports, context) => {
  const srcFiles = resolveFiles(getSrc(src), ignoreExports)
  prepareImportsAndExports(srcFiles, context)
  determineUsage()
  preparationDone = true
}

const newNamespaceImportExists = specifiers =>
  specifiers.some(({ type }) => type === IMPORT_NAMESPACE_SPECIFIER)

const newDefaultImportExists = specifiers =>
  specifiers.some(({ type }) => type === IMPORT_DEFAULT_SPECIFIER)

module.exports = {
  meta: {
    docs: { url: docsUrl('no-unused-modules') },
    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1,
          },
        },
        ignoreExports: {
          description:
            'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1,
          },
        },
        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean',
        },
        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean',
        },
      },
      not: {
        properties: {
          unusedExports: { enum: [false] },
          missingExports: { enum: [false] },
        },
      },
      anyOf:[{
        not: {
          properties: {
            unusedExports: { enum: [true] },
          },
        },
        required: ['missingExports'],
      }, {
        not: {
          properties: {
            missingExports: { enum: [true] },
          },
        },
        required: ['unusedExports'],
      }, {
        properties: {
          unusedExports: { enum: [true] },
        },
        required: ['unusedExports'],
      }, {
        properties: {
          missingExports: { enum: [true] },
        },
        required: ['missingExports'],
      }],
    }],
  },

  create: context => {
    const {
      src,
      ignoreExports = [],
      missingExports,
      unusedExports,
    } = context.options[0]

    if (unusedExports && !preparationDone) {
      doPreparation(src, ignoreExports, context)
    }
    
    const file = context.getFilename()

    const checkExportPresence = node => {
      if (!missingExports) {
        return
      }

      const exportCount = exportList.get(file)
      const exportAll = exportCount.get(EXPORT_ALL_DECLARATION)
      const namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER)

      exportCount.delete(EXPORT_ALL_DECLARATION)
      exportCount.delete(IMPORT_NAMESPACE_SPECIFIER)
      if (missingExports && exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found')
      }
      exportCount.set(EXPORT_ALL_DECLARATION, exportAll)
      exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports)
    }

    const checkUsage = (node, exportedValue) => {
      if (!unusedExports) {
        return
      }

      if (ignoredFiles.has(file)) {
        return
      }

      exports = exportList.get(file)

      // special case: export * from 
      const exportAll = exports.get(EXPORT_ALL_DECLARATION)
      if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
        if (exportAll.whereUsed.size > 0) {
          return
        }
      }

      // special case: namespace import
      const namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER)
      if (typeof namespaceImports !== 'undefined') {
        if (namespaceImports.whereUsed.size > 0) {
          return
        }
      }

      const exportStatement = exports.get(exportedValue)
      
      const value = exportedValue === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportedValue
      
      if (typeof exportStatement !== 'undefined'){
        if (exportStatement.whereUsed.size < 1) {
          context.report(
            node,
            `exported declaration '${value}' not used within other modules`
          )
        }
      } else {
        context.report(
          node,
          `exported declaration '${value}' not used within other modules`
        )
      }
    }

    /**
     * only useful for tools like vscode-eslint
     * 
     * update lists of existing exports during runtime
     */
    const updateExportUsage = node => {
      if (ignoredFiles.has(file)) {
        return
      }

      let exports = exportList.get(file)

      // new module has been created during runtime
      // include it in further processing
      if (typeof exports === 'undefined') {
        exports = new Map()
      }

      const newExports = new Map()
      const newExportIdentifiers = new Set()

      node.body.forEach(({ type, declaration, specifiers }) => {
        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER)
        } 
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach(specifier => {
              if (specifier.exported) {
                newExportIdentifiers.add(specifier.exported.name)
              }
            })
          }
          if (declaration) {
            if (declaration.type === FUNCTION_DECLARATION) {
              newExportIdentifiers.add(declaration.id.name)
            }   
            if (declaration.type === VARIABLE_DECLARATION) {
              declaration.declarations.forEach(({ id }) => {
                newExportIdentifiers.add(id.name)
              })
            }
          }
        }
      })

      // old exports exist within list of new exports identifiers: add to map of new exports
      exports.forEach((value, key) => {
        if (newExportIdentifiers.has(key)) {
          newExports.set(key, value)
        }
      })

      // new export identifiers added: add to map of new exports
      newExportIdentifiers.forEach(key => {
        if (!exports.has(key)) {
          newExports.set(key, { whereUsed: new Set() })
        }
      })

      // preserve information about namespace imports
      let exportAll = exports.get(EXPORT_ALL_DECLARATION)
      let namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER)
      
      if (typeof namespaceImports === 'undefined') {
        namespaceImports = { whereUsed: new Set() }
      }

      newExports.set(EXPORT_ALL_DECLARATION, exportAll)
      newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports)
      exportList.set(file, newExports)
    }

    /**
     * only useful for tools like vscode-eslint
     * 
     * update lists of existing imports during runtime
     */
    const updateImportUsage = node => {
      if (!unusedExports) {
        return
      }

      let oldImportPaths = importList.get(file)
      if (typeof oldImportPaths === 'undefined') {
        oldImportPaths = new Map()
      }
      
      const oldNamespaceImports = new Set()
      const newNamespaceImports = new Set()

      const oldExportAll = new Set()
      const newExportAll = new Set()
      
      const oldDefaultImports = new Set()
      const newDefaultImports = new Set()

      const oldImports = new Map()
      const newImports = new Map()
      oldImportPaths.forEach((value, key) => {
        if (value.has(EXPORT_ALL_DECLARATION)) {
          oldExportAll.add(key)
        }
        if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
          oldNamespaceImports.add(key)
        }
        if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
          oldDefaultImports.add(key)
        }
        value.forEach(val => {
          if (val !== IMPORT_NAMESPACE_SPECIFIER &&
              val !== IMPORT_DEFAULT_SPECIFIER) {
               oldImports.set(val, key)
             }
        })
      })

      node.body.forEach(astNode => {
        let resolvedPath

        // support for export { value } from 'module'
        if (astNode.type === EXPORT_NAMED_DECLARATION) {
          if (astNode.source) {
            resolvedPath = resolve(astNode.source.value, context)
            astNode.specifiers.forEach(specifier => {
              let name
              if (specifier.exported.name === DEFAULT) {
                name = IMPORT_DEFAULT_SPECIFIER
              } else {
                name = specifier.local.name
              }
              newImports.set(name, resolvedPath)
            })
          }
        }

        if (astNode.type === EXPORT_ALL_DECLARATION) {
          resolvedPath = resolve(astNode.source.value, context)
          newExportAll.add(resolvedPath)
        }

        if (astNode.type === IMPORT_DECLARATION) {
          resolvedPath = resolve(astNode.source.value, context)       
          if (!resolvedPath) {
            return
          }
          
          if (isNodeModule(resolvedPath)) {
            return
          }

          if (newNamespaceImportExists(astNode.specifiers)) {
            newNamespaceImports.add(resolvedPath)
          }

          if (newDefaultImportExists(astNode.specifiers)) {
            newDefaultImports.add(resolvedPath)
          }

          astNode.specifiers.forEach(specifier => {
            if (specifier.type === IMPORT_DEFAULT_SPECIFIER ||
                specifier.type === IMPORT_NAMESPACE_SPECIFIER) {
              return
            }
            newImports.set(specifier.local.name, resolvedPath)
          })
        }
      })

      newExportAll.forEach(value => {
        if (!oldExportAll.has(value)) {
          let imports = oldImportPaths.get(value)
          if (typeof imports === 'undefined') {
            imports = new Set()
          }
          imports.add(EXPORT_ALL_DECLARATION)
          oldImportPaths.set(value, imports)

          let exports = exportList.get(value)
          let currentExport
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(EXPORT_ALL_DECLARATION)
          } else {
            exports = new Map()
            exportList.set(value, exports)
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file)
          } else {
            const whereUsed = new Set()
            whereUsed.add(file)
            exports.set(EXPORT_ALL_DECLARATION, { whereUsed })
          }
        }
      })

      oldExportAll.forEach(value => {
        if (!newExportAll.has(value)) {
          const imports = oldImportPaths.get(value)
          imports.delete(EXPORT_ALL_DECLARATION)

          const exports = exportList.get(value)
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(EXPORT_ALL_DECLARATION)
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file)
            }
          }
        }
      })

      newDefaultImports.forEach(value => {
        if (!oldDefaultImports.has(value)) {
          let imports = oldImportPaths.get(value)
          if (typeof imports === 'undefined') {
            imports = new Set()
          }
          imports.add(IMPORT_DEFAULT_SPECIFIER)
          oldImportPaths.set(value, imports)

          let exports = exportList.get(value)
          let currentExport
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER)
          } else {
            exports = new Map()
            exportList.set(value, exports)
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file)
          } else {
            const whereUsed = new Set()
            whereUsed.add(file)
            exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed })
          }
        }
      })

      oldDefaultImports.forEach(value => {
        if (!newDefaultImports.has(value)) {
          const imports = oldImportPaths.get(value)
          imports.delete(IMPORT_DEFAULT_SPECIFIER)

          const exports = exportList.get(value)
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER)
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file)
            }
          }
        }
      })

      newNamespaceImports.forEach(value => {
        if (!oldNamespaceImports.has(value)) {
          let imports = oldImportPaths.get(value)
          if (typeof imports === 'undefined') {
            imports = new Set()
          }
          imports.add(IMPORT_NAMESPACE_SPECIFIER)
          oldImportPaths.set(value, imports)

          let exports = exportList.get(value)
          let currentExport
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER)
          } else {
            exports = new Map()
            exportList.set(value, exports)
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file)
          } else {
            const whereUsed = new Set()
            whereUsed.add(file)
            exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed })
          }
        }
      })

      oldNamespaceImports.forEach(value => {
        if (!newNamespaceImports.has(value)) {
          const imports = oldImportPaths.get(value)
          imports.delete(IMPORT_NAMESPACE_SPECIFIER)

          const exports = exportList.get(value)
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER)
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file)
            }
          }
        }
      })

      newImports.forEach((value, key) => {
        if (!oldImports.has(key)) {
          let imports = oldImportPaths.get(value)
          if (typeof imports === 'undefined') {
            imports = new Set()
          }
          imports.add(key)
          oldImportPaths.set(value, imports)

          let exports = exportList.get(value)
          let currentExport
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(key)
          } else {
            exports = new Map()
            exportList.set(value, exports)
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file)
          } else {
            const whereUsed = new Set()
            whereUsed.add(file)
            exports.set(key, { whereUsed })
          }
        }
      })

      oldImports.forEach((value, key) => {
        if (!newImports.has(key)) {
          const imports = oldImportPaths.get(value)
          imports.delete(key)

          const exports = exportList.get(value)
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(key)
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file)
            }
          }
        }
      })
    }

    return {
      'Program:exit': node => {
        updateExportUsage(node)
        updateImportUsage(node)
        checkExportPresence(node)
      },
      'ExportDefaultDeclaration': node => {
        checkUsage(node, IMPORT_DEFAULT_SPECIFIER)
      },
      'ExportNamedDeclaration': node => {
        node.specifiers.forEach(specifier => {
            checkUsage(node, specifier.exported.name)
        })
        if (node.declaration) {
          if (node.declaration.type === FUNCTION_DECLARATION) {
            checkUsage(node, node.declaration.id.name)
          }
          if (node.declaration.type === VARIABLE_DECLARATION) {
            node.declaration.declarations.forEach(declaration => {
              checkUsage(node, declaration.id.name)
            })
          }
        }
      },
    }
  },
}
