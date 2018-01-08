const repoUrl = 'https://github.com/benmosher/eslint-plugin-import'

export default function docsUrl(ruleName, commitHash = 'master') {
  return `${repoUrl}/blob/${commitHash}/docs/rules/${ruleName}.md`
}
