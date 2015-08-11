/**
 * @fileOverview Ensures that an imported path exists, given resolution rules.
 * @author Ben Mosher
 */
import resolve from '../core/resolve'

export default function (context) {
  const caseSensitive = context.options[0] === 'case-sensitive'

  function checkSource(node) {
    if (node.source == null) return

    if (resolve(node.source.value, context, caseSensitive) == null) {
      context.report(node.source,
        'Unable to resolve path to module \'' + node.source.value + '\'.')
    }
  }

  return {
    'ImportDeclaration': checkSource,
    'ExportNamedDeclaration': checkSource,
    'ExportAllDeclaration': checkSource
  }
}
