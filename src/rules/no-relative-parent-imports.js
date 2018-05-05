import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'
import docsUrl from '../docsUrl'

import importType from '../core/importType'

module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-relative-parent-imports'),
    },
    schema: [makeOptionsSchema()],
  },

  create: function noRelativePackages(context) {
    const myPath = context.getFilename()
    if (myPath === '<text>') return {} // can't cycle-check a non-file

    function checkSourceValue(sourceNode) {
      if (importType(sourceNode.value, context) === 'parent') {
        context.report({
          node: sourceNode,
          message: 'Relative imports from parent directories are not allowed.',
        })
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
