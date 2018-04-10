import docsUrl from '../docsUrl'

module.exports = {
  meta: {
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

    const commentFormat = ` webpackChunkName: "${webpackChunknameFormat}" `
    const commentRegex = new RegExp(commentFormat)

    return {
      [`CallExpression[callee.type="Import"],CallExpression[callee.name]`](node) {
        const { callee: { name }} = node
        if (name && importFunctions.indexOf(name) < 0) {
          return
        }

        const sourceCode = context.getSourceCode()
        const arg = node.arguments[0]
        const leadingComments = sourceCode.getComments(arg).leading

        if (!leadingComments || leadingComments.length !== 1) {
          context.report({
            node,
            message: 'dynamic imports require a leading comment with the webpack chunkname',
          })
          return
        }

        const comment = leadingComments[0]
        if (comment.type !== 'Block') {
          context.report({
            node,
            message: 'dynamic imports require a /* foo */ style comment, not a // foo comment',
          })
          return
        }

        const webpackChunkDefinition = comment.value
        if (!webpackChunkDefinition.match(commentRegex)) {
          context.report({
            node,
            message: `dynamic imports require a leading comment in the form /*${commentFormat}*/`,
          })
        }
      },
    }
  },
}
