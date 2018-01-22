import pkg from '../package.json'

const repoUrl = 'https://github.com/benmosher/eslint-plugin-import'

export default function docsUrl(ruleName, commitish = `v${pkg.version}`) {
  return `${repoUrl}/blob/${commitish}/docs/rules/${ruleName}.md`
}
