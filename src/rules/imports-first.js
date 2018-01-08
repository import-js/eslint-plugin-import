import first from './first'

const ruleDocsUrl = 'https://github.com/benmosher/eslint-plugin-import/blob'

const newMeta = Object.assign({}, first.meta, {
  deprecated: true,
  docs: {
    url: `${ruleDocsUrl}/7b25c1cb95ee18acc1531002fd343e1e6031f9ed/docs/rules/imports-first.md`,
  },
})

module.exports = Object.assign({}, first, { meta: newMeta })
