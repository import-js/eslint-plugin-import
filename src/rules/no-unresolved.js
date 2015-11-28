/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */
import resolve from '../core/resolve'

module.exports = function (context) {

  function checkSourceValue(source) {
    if (source == null) return

    if (resolve(source.value, context) === undefined) {
      context.report(source,
        'Unable to resolve path to module \'' + source.value + '\'.')
    }
  }

  // for import-y declarations
  function checkSource(node) {
    checkSourceValue(node.source)
  }

  // for CommonJS `require` calls
  // adapted from @mctep: http://git.io/v4rAu
  function checkCommon(call) {
    if (call.callee.type !== 'Identifier') return
    if (call.callee.name !== 'require') return
    if (call.arguments.length !== 1) return

    const modulePath = call.arguments[0]
    if (modulePath.type !== 'Literal') return
    if (typeof modulePath.value !== 'string') return

    checkSourceValue(modulePath)
  }

  function checkAMD(call) {
    if (call.callee.type !== 'Identifier') return
    if (call.callee.name !== 'require' &&
        call.callee.name !== 'define') return
    if (call.arguments.length !== 2) return

    const modules = call.arguments[0]
    if (modules.type !== 'ArrayExpression') return

    for (let element of modules.elements) {
      if (element.type !== 'Literal') continue
      if (typeof element.value !== 'string') continue

      checkSourceValue(element)
    }
  }

  const visitors = {
    'ImportDeclaration': checkSource,
    'ExportNamedDeclaration': checkSource,
    'ExportAllDeclaration': checkSource,
  }

  if (context.options[0] != null) {
    const { commonjs, amd } = context.options[0]

    if (commonjs || amd) {
      visitors['CallExpression'] = function (call) {
        if (commonjs) checkCommon(call)
        if (amd) checkAMD(call)
      }
    }
  }

  return visitors
}

module.exports.schema = [
  {
    'type': 'object',
    'properties': {
      'commonjs': { 'type': 'boolean' },
      'amd': { 'type': 'boolean' },
    },
    'additionalProperties': false,
  },
]
