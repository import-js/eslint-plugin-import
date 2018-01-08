import { isAbsolute } from '../core/importType'
import moduleVisitor, { makeOptionsSchema } from 'eslint-module-utils/moduleVisitor'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules'

module.exports = {
  meta: {
    docs: {
      url: `${ruleDocsUrl}/no-absolute-path.md`,
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
