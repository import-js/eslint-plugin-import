import vm from 'vm'
import docsUrl from '../docsUrl'

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: docsUrl('dynamic-import-chunkname'),
    },
    schema: [{
      type: 'object',
      properties: {
        importFunctions: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        webpackChunknameFormat: {
          type: 'string',
        },
      },
    }],
  },

  create: function (context) {
    const config = context.options[0]
    const { importFunctions = [] } = config || {}
    const { webpackChunknameFormat = '[0-9a-zA-Z-_/.]+' } = config || {}

    const paddedCommentRegex = /^ (\S[\s\S]+\S) $/
    const commentStyleRegex = /^( \w+: ("[^"]*"|\d+|false|true),?)+ $/
    const chunkSubstrFormat = ` webpackChunkName: "${webpackChunknameFormat}",? `
    const chunkSubstrRegex = new RegExp(chunkSubstrFormat)

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Import' && importFunctions.indexOf(node.callee.name) < 0) {
          return
        }

        const sourceCode = context.getSourceCode()
        const arg = node.arguments[0]
        const leadingComments = sourceCode.getComments(arg).leading

        if (!leadingComments || leadingComments.length === 0) {
          context.report({
            node,
            message: 'dynamic imports require a leading comment with the webpack chunkname',
          })
          return
        }

        let isChunknamePresent = false

        for (const comment of leadingComments) {
          if (comment.type !== 'Block') {
            context.report({
              node,
              message: 'dynamic imports require a /* foo */ style comment, not a // foo comment',
            })
            return
          }

          if (!paddedCommentRegex.test(comment.value)) {
            context.report({
              node,
              message: `dynamic imports require a block comment padded with spaces - /* foo */`,
            })
            return
          }

          try {
            // just like webpack itself does
            vm.runInNewContext(`(function(){return {${comment.value}}})()`)
          }
          catch (error) {
            context.report({
              node,
              message: `dynamic imports require a "webpack" comment with valid syntax`,
            })
            return
          }

          if (!commentStyleRegex.test(comment.value)) {
            context.report({
              node,
              message:
                `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/`,
            })
            return
          }

          if (chunkSubstrRegex.test(comment.value)) {
            isChunknamePresent = true
          }
        }

        if (!isChunknamePresent) {
          context.report({
            node,
            message:
              `dynamic imports require a leading comment in the form /*${chunkSubstrFormat}*/`,
          })
        }
      },
    }
  },
}
