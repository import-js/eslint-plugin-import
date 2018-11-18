import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'
import { isAbsolute } from '../core/importType'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('no-absolute-path'),
    },
    schema: [ makeOptionsSchema() ],
  },

  create: function (context) {
    function reportIfAbsolute(source) {
      if (isAbsolute(source.value)) {
        context.report(source, 'Do not import modules using an absolute path')
      }
    }

    const options = Object.assign({ esmodule: true, commonjs: true }, context.options[0])
    return moduleVisitor(reportIfAbsolute, options)
  },
}
