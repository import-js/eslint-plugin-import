/**
 * @fileOverview Ensures that modules contain exports and/or all 
 * modules are consumed within other modules.
 * @author René Fermann
 */

import Exports from '../ExportMap'
import { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'
import { listFilesToProcess } from 'eslint/lib/util/glob-util'
import resolve from 'eslint-module-utils/resolve'
import docsUrl from '../docsUrl'

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration'
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration'
const IMPORT_DECLARATION = 'ImportDeclaration' 
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier' 
const IMPORT_SPECIFIER = 'ImportSpecifier'
const VARIABLE_DECLARATION = 'VariableDeclaration'
const FUNCTION_DECLARATION = 'FunctionDeclaration'
const DEFAULT = 'default'
const UNDEFINED = 'undefined'

let preparationDone = false
const importList = new Map()
const exportList = new Map()
const ignoredFiles = new Set()

const isNodeModule = path => {
  return path.indexOf('node_modules') > -1
}

/**
 * read all files matching the patterns in src and ignore
 * 
 * return all files matching src pattern, which are not matching the ignore pattern
 */
const resolveFiles = (src, ignore) => {
  const srcFiles = new Set()
  const srcFileList = listFilesToProcess(src)

  // prepare list of ignored files
  const ignoredFilesList =  listFilesToProcess(ignore)
  ignoredFilesList.forEach(({ filename }) => ignoredFiles.add(filename))

  // prepare list of source files, don't consider files from node_modules
  srcFileList.forEach(({ filename }) => {
    if (isNodeModule(filename)) {
      return
    }
    srcFiles.add(filename)
  })
  return srcFiles
}

/**
 * parse all source files and build up 2 maps containing the existing imports and exports
 */
const prepareImportsAndExports = (srcFiles, context) => {
  srcFiles.forEach(file => {
    const exports = new Map()
    const imports = new Map()
    const currentExports = Exports.get(file, context)
    if (!currentExports) {
      return
    }
    const { imports: localImportList, namespace } = currentExports
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
      exports.set(key, { whereUsed: new Set() })
    })
    exportList.set(file, exports)
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
      if (typeof exports !== UNDEFINED) {
        value.forEach(currentImport => {
          let specifier
          if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = DEFAULT
          } else {
            specifier = currentImport
          }
          if (typeof specifier !== UNDEFINED) {
            const exportStatement = exports.get(specifier)
            if (typeof exportStatement !== UNDEFINED) {
              const {whereUsed} = exportStatement
              whereUsed.add(listKey)
              exports.set(specifier, { whereUsed })
            }
          }
        })
      }
    })
  })
}

/**
 * prepare the lists of existing imports and exports - should only be executed once at
 * the start of a new eslint run
 */
const doPreparation = (src, ignore, context) => {
  const { id } = context

  // do some sanity checks
  if (!Array.isArray(src)) {
    throw new Error(`Rule ${id}: src option must be an array`)
  }

  if (!Array.isArray(ignore)) {
    throw new Error(`Rule ${id}: ignore option must be an array`)
  }

  if (src.length < 1) {
    throw new Error(`Rule ${id}: src option must be defined`)
  }

  // no empty patterns for paths, as this will cause issues during path resolution
  src.forEach(file => {
    if (file.length < 1) {
      throw new Error(`Rule ${id}: src option must not contain empty strings`)
    }
  })

  ignore.forEach(file => {
    if (file.length < 1) {
      throw new Error(`Rule ${id}: ignore option must not contain empty strings`)
    }
  })

  const srcFiles = resolveFiles(src, ignore)
  prepareImportsAndExports(srcFiles, context)
  determineUsage()  
  preparationDone = true
}

const oldDefaultImportExists = imports => {
  return imports.has(IMPORT_DEFAULT_SPECIFIER)
}

const newDefaultImportExists = specifiers => {
  let hasNewDefaultImport = false
  specifiers.forEach(specifier => {
    if (specifier.type === IMPORT_DEFAULT_SPECIFIER) {
      hasNewDefaultImport = true
    }
  })
  return hasNewDefaultImport
}

module.exports = {
  doPreparation,
  meta: {
    docs: { url: docsUrl('no-unused-modules') },
    schema: [
      makeOptionsSchema({
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
        },
        ignore: {
          description: 'files/paths to be ignored (only for unused exports)',
          type: 'array',
        },
        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean',
        },
        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean',
        },
      }),
    ],
  },

  create: context => {
    const { src, ignore, missingExports = false, unusedExports = false } = context.options[0]

    if (unusedExports && !preparationDone) {
      doPreparation(src, ignore, context)
    }
    
    const file = context.getFilename()

    const checkExportPresence = node => {
      if (ignoredFiles.has(file)) {
        return
      }

      const exportCount = exportList.get(file)
      if (missingExports && exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found')
      }
    }

    const checkUsage = (node, exportedValue) => {
      if (!unusedExports) {
        return
      }

      if (ignoredFiles.has(file)) {
        return
      }
      const exports = exportList.get(file)
      const exportStatement = exports.get(exportedValue)
      if (typeof exportStatement !== UNDEFINED){
        const { whereUsed } = exportStatement
        if ( whereUsed.size < 1) {
          context.report(
            node,
            `exported declaration '${exportedValue}' not used within other modules`
          )
        }
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
      if (typeof exports === UNDEFINED) {
        exports = new Map()
      }

      const newExports = new Map()
      const newExportIdentifiers = new Set()

      node.body.forEach(({ type, declaration, specifiers }) => {
        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(DEFAULT)
        } 
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach(specifier => {
              newExportIdentifiers.add(specifier.local.name)
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
          newExports.set(key, {whereUsed: new Set()})
        }
      })
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
      const oldImportPaths = importList.get(file)
      
      node.body.forEach(astNode => {
        if (astNode.type === IMPORT_DECLARATION) {
          const resolvedPath = resolve(astNode.source.value, context)
          
          if (!resolvedPath) {
            return
          }
          
          if (isNodeModule(resolvedPath)) {
            return
          }
          let imports = oldImportPaths.get(resolvedPath)
          const exports = exportList.get(resolvedPath)

          // unknown module
          if (typeof exports === UNDEFINED) {
            return
          }
          if (typeof imports === UNDEFINED) {
            imports = new Set()
          }

          const tmpImports = new Set()
          imports.forEach((value, key) => {
            if (key !== IMPORT_DEFAULT_SPECIFIER) {
              tmpImports.add(key)
            }
          })
          
          // update usage of default import/export
          const defaultExport = exports.get(DEFAULT)
          const hasOldDefaultImport = oldDefaultImportExists(imports)
          const hasNewDefaultImport = newDefaultImportExists(astNode.specifiers)

          if (hasNewDefaultImport && !hasOldDefaultImport) {
            imports.add(IMPORT_DEFAULT_SPECIFIER)
            if (typeof defaultExport !== UNDEFINED) {
              const { whereUsed } = defaultExport
              whereUsed.add(file)
            }
          }

          if (!hasNewDefaultImport && hasOldDefaultImport) {
            imports.delete(IMPORT_DEFAULT_SPECIFIER)
            if (typeof defaultExport !== UNDEFINED) {
              const { whereUsed } = defaultExport
              whereUsed.delete(file)
            }
          }

          // update usage of named imports/export
          astNode.specifiers.forEach(specifier => {
            imports.add(specifier.local.name)
            tmpImports.delete(specifier.local.name)
            
            const currentExport = exports.get(specifier.local.name)
            if (specifier.type === IMPORT_SPECIFIER) {
              if (typeof currentExport !== UNDEFINED) {
                currentExport.whereUsed.add(file)
              }
            }
          })

          // one or more imports have been removed: update usage list of exports
          if (tmpImports.size > 0) {
            tmpImports.forEach(key => {
              const currentExport = exports.get(key)
              if (typeof currentExport !== UNDEFINED) {
                const { whereUsed } = currentExport
                whereUsed.delete(file)
              }
            })
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
        checkUsage(node, DEFAULT)
      },
      'ExportNamedDeclaration': node => {
        if (node.specifiers) {
          node.specifiers.forEach(specifier => {
            if (specifier.exported) {
              checkUsage(node, specifier.exported.name)
            }
          })
        }
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
