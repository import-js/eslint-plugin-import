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

  function checkSource(node) {
    checkSourceValue(node.source)
  }

  return {
    'ImportDeclaration': checkSource,
    'ExportNamedDeclaration': checkSource,
    'ExportAllDeclaration': checkSource
  }
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
