/**
 * Ensure that the imported file is an ES6 module (use ES6 export).
 */

import fs from 'fs'
import espree from 'espree'

import resolve from 'eslint-module-utils/resolve'
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'

function containES6export(ast) {
  if (!ast.body) {
    return {es6: false, err: 'unkown AST'}
  }
  const es6export = ast.body.find(
    node => node.type ? 
    [
      'ExportDefaultDeclaration',
      'ExportNamedDeclaration',
      'ExportAllDeclaration',
      'ExportSpecifier',
    ].includes(node.type) :
    false
  )

  return {es6: es6export, err: null}
}

module.exports = {
  meta: {
    schema: [ makeOptionsSchema({
      espreeConfiguration: { 
        type: 'object',
        default: { ecmaVersion: 9, sourceType: 'module', ecmaFeatures: { jsx: true } } ,
      },
    })],
  },

  create: function (context) {
    const espreeConfiguration = Object.assign(
      { ecmaVersion: 9, sourceType: 'module', ecmaFeatures: { jsx: true } },
      context.options[0] ? context.options[0].espreeConfiguration || {} : {}
    )
    function checkSourceValue(source) {
      const resolvedPath = resolve(source.value, context)

      if (resolvedPath !== undefined) {
        const code = fs.readFileSync(resolvedPath)
        
        const ast = espree.parse(code, espreeConfiguration)
        const result = containES6export(ast)
        if (!result.es6) {
          if (result.err) {
            context.report(source,
              `Not possible to check '${source.value}'.`)
          }
          context.report(source,
            `Not an ES6 module '${source.value}'.`)
        }
      } else {
        context.report(source,
          `Not possible to check '${source.value}'.`)
      }

    }

    return moduleVisitor(checkSourceValue, context.options[0])

  },
}

