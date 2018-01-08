const repoUrl = 'https://github.com/benmosher/eslint-plugin-import'

export default function docsUrl(ruleName, commitHash) {
  let baseUrl = `${repoUrl}/tree/master/docs/rules`
  if (commitHash) {
    baseUrl = `${repoUrl}/blob/${commitHash}/docs/rules`
  }

  return `${baseUrl}/${ruleName}.md`
}
