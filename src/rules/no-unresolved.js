/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */
import resolve from '../core/resolve'

module.exports = function (context) {

  function checkSourceValue(source) {
    if (source == null) return

    if (resolve(source.value, context) == null) {
      context.report(source,
        'Unable to resolve path to module \'' + source.value + '\'.')
    }
  }

  // for import-y declarations
  function checkSource(node) {
    checkSourceValue(node.source)
  }

  // for CommonJS `require` calls
  // adapted from https://github.com/mctep/eslint-plugin-import/commit/acd4b4508d551f7f800fdd06e5c64ec01f3d1113
  function checkCommon(call) {
    if (call.callee.type !== 'Identifier') return
    if (call.callee.name !== 'require') return
    if (call.arguments.length !== 1) return

    const modulePath = call.arguments[0]
    if (modulePath.type !== 'Literal') return
    if (typeof modulePath.value !== 'string') return

    checkSourceValue(modulePath)
  }

  const visitors = {
    'ImportDeclaration': checkSource,
    'ExportNamedDeclaration': checkSource,
    'ExportAllDeclaration': checkSource
  }

  if (context.options[0] != null) {
    const { commonjs } = context.options[0]
    if (commonjs) {
      visitors['CallExpression'] = checkCommon
    }
  }

  return visitors
}

module.exports.schema = [
  {
    "type": "object",
    "properties": {
      "commonjs": {
        "type": "boolean"
      }
    },
    "additionalProperties": false
  }
]
