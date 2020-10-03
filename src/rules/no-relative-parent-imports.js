import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'
import docsUrl from '../docsUrl'
import { basename, dirname, relative } from 'path'
import resolve from 'eslint-module-utils/resolve'

import importType from '../core/importType'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-relative-parent-imports'),
    },
    schema: [makeOptionsSchema()],
  },

  create: function noRelativePackages(context) {
    const myPath = context.getFilename()
    if (myPath === '<text>') return {} // can't check a non-file

    function resolvedImportType(depPath) {
      const absDepPath = resolve(depPath, context)

      if (!absDepPath) { // unable to resolve path
        return
      }

      const relDepPath = relative(dirname(myPath), absDepPath)

      return importType(relDepPath, context)
    }

    function checkSourceValue(sourceNode) {
      const depPath = sourceNode.value
      const depType = importType(depPath, context)

      if (depType === 'external') { // ignore packages
        return
      }

      if (depType === 'parent' || resolvedImportType(depPath) === 'parent') {
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
