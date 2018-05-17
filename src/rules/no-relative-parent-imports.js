import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'
import docsUrl from '../docsUrl'
import { basename } from 'path'

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
      const depPath = sourceNode.value
      if (importType(depPath, context) === 'parent') {
        context.report({
          node: sourceNode,
          message: 'Relative imports from parent directories are not allowed. ' +
            `Please either pass what you're importing through at runtime ` +
            `(dependency injection), move \`${basename(myPath)}\` to same ` +
            `directory as \`${depPath}\` or consider making \`${depPath}\` a package.`,
        })
      }
    }

    return moduleVisitor(checkSourceValue, context.options[0])
  },
}
